<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\User;
use App\Services\PerformanceCache;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_only_published_courses_are_publicly_visible_and_filterable(): void
    {
        $instructor = $this->instructor('approved');
        $category = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        $published = $this->course($instructor, $category, ['status' => 'published', 'published_at' => now(), 'level' => 'beginner']);
        $this->course($instructor, $category, ['title' => 'Hidden Draft', 'slug' => 'hidden-draft']);

        $this->getJson('/api/courses?level=beginner&category=programming')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $published->id);
    }

    public function test_course_description_returns_safe_formatted_html(): void
    {
        $instructor = $this->instructor('approved');
        $category = Category::create(['name' => 'Security', 'slug' => 'security']);
        $course = $this->course($instructor, $category, [
            'status' => 'published',
            'published_at' => now(),
            'description' => '<h2>About</h2><p onclick="steal()">Safe text</p><script>alert(1)</script><a href="javascript:alert(1)">Link</a>',
        ]);

        $description = $this->getJson("/api/courses/{$course->slug}")
            ->assertOk()
            ->json('data.description');

        $this->assertStringContainsString('<h2>About</h2>', $description);
        $this->assertStringContainsString('<p>Safe text</p>', $description);
        $this->assertStringNotContainsString('onclick', $description);
        $this->assertStringNotContainsString('<script', $description);
        $this->assertStringNotContainsString('javascript:', $description);
    }

    public function test_an_instructor_can_only_update_their_own_editable_course(): void
    {
        $owner = $this->instructor('approved');
        $other = $this->instructor('approved');
        $category = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        $course = $this->course($owner, $category);

        $this->actingAs($other)->putJson("/api/manage/courses/{$course->id}", ['title' => 'Unauthorized'])->assertForbidden();
        $this->actingAs($owner)->putJson("/api/manage/courses/{$course->id}", ['title' => 'Updated Course'])->assertOk();
    }

    public function test_course_publication_requires_an_approved_instructor_and_admin(): void
    {
        $instructor = $this->instructor('pending');
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $category = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        $course = $this->course($instructor, $category);
        $course->update(['thumbnail' => '/storage/courses/test/thumbnail.png']);
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Introduction', 'position' => 1]);
        $lesson = Lesson::create([
            'course_section_id' => $section->id, 'title' => 'Welcome', 'slug' => 'welcome',
            'content_type' => 'text', 'duration' => 1, 'position' => 1, 'is_published' => false,
        ]);

        $this->actingAs($instructor)->postJson("/api/manage/courses/{$course->id}/submit")->assertForbidden();
        $this->actingAs($admin)->patchJson("/api/admin/instructors/{$instructor->id}/status", ['status' => 'approved'])->assertOk();
        $instructor->refresh();
        $this->actingAs($instructor)->postJson("/api/manage/courses/{$course->id}/submit")->assertOk()->assertJsonPath('data.status', 'pending_review');
        $this->actingAs($admin)->postJson("/api/admin/courses/{$course->id}/approve")->assertOk()->assertJsonPath('data.status', 'published');
        $this->assertTrue($lesson->fresh()->is_published);
    }

    public function test_a_student_can_apply_to_become_a_pending_instructor(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($student)
            ->postJson('/api/instructor/apply')
            ->assertOk()
            ->assertJsonPath('user.instructor_status', 'pending')
            ->assertJsonPath('user.roles.0.name', 'student');

        $this->assertFalse($student->fresh()->hasRole('instructor'));
    }

    public function test_a_pending_instructor_cannot_create_a_course(): void
    {
        $category = Category::create(['name' => 'Pending Courses', 'slug' => 'pending-courses']);

        $this->actingAs($this->instructor('pending'))
            ->postJson('/api/manage/courses', $this->coursePayload($category))
            ->assertForbidden();
    }

    public function test_a_rejected_instructor_cannot_create_a_course(): void
    {
        $category = Category::create(['name' => 'Rejected Courses', 'slug' => 'rejected-courses']);

        $this->actingAs($this->instructor('rejected'))
            ->postJson('/api/manage/courses', $this->coursePayload($category))
            ->assertForbidden();
    }

    public function test_an_approved_instructor_can_create_a_course(): void
    {
        $category = Category::create(['name' => 'Approved Courses', 'slug' => 'approved-courses']);

        $this->actingAs($this->instructor('approved'))
            ->postJson('/api/manage/courses', $this->coursePayload($category))
            ->assertCreated();

        $this->assertDatabaseHas('courses', [
            'title' => 'Authorization Course',
            'status' => 'draft',
        ]);
    }

    public function test_a_student_cannot_access_instructor_course_apis(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        $category = Category::create(['name' => 'Student Denied', 'slug' => 'student-denied']);

        $this->actingAs($student)->getJson('/api/manage/courses')->assertForbidden();
        $this->actingAs($student)
            ->postJson('/api/manage/courses', $this->coursePayload($category))
            ->assertForbidden();
    }

    public function test_categories_support_a_public_parent_child_hierarchy(): void
    {
        $parent = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        Category::create(['parent_id' => $parent->id, 'name' => 'Web Development', 'slug' => 'web-development']);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.children.0.name', 'Web Development');
    }

    public function test_public_categories_and_published_catalog_are_cached_and_invalidated(): void
    {
        $instructor = $this->instructor('approved');
        $category = Category::create(['name' => 'Cached Category', 'slug' => 'cached-category']);
        $course = $this->course($instructor, $category, [
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->getJson('/api/categories')->assertJsonPath('data.0.name', 'Cached Category');
        $this->assertTrue(Cache::has(PerformanceCache::PUBLIC_CATEGORIES));

        $this->getJson('/api/courses')->assertJsonPath('data.0.title', 'Laravel Fundamentals');
        $this->assertTrue(Cache::has(PerformanceCache::publicCatalogKey([])));

        $category->update(['name' => 'Updated Category']);
        $this->assertFalse(Cache::has(PerformanceCache::PUBLIC_CATEGORIES));
        $this->getJson('/api/categories')->assertJsonPath('data.0.name', 'Updated Category');

        $course->update(['title' => 'Updated Laravel Fundamentals']);
        $this->getJson('/api/courses')->assertJsonPath('data.0.title', 'Updated Laravel Fundamentals');
    }

    public function test_only_admins_can_list_instructor_applications(): void
    {
        $instructor = $this->instructor('pending');
        $student = User::factory()->create();
        $student->assignRole('student');
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($student)->getJson('/api/admin/instructors')->assertForbidden();
        $this->actingAs($admin)->getJson('/api/admin/instructors?status=pending')
            ->assertOk()
            ->assertJsonPath('data.0.id', $instructor->id)
            ->assertJsonMissingPath('data.0.password');
    }

    private function instructor(string $status): User
    {
        $user = User::factory()->create(['instructor_status' => $status]);
        $user->assignRole('instructor');

        return $user;
    }

    private function course(User $instructor, Category $category, array $overrides = []): Course
    {
        return Course::create(array_merge([
            'instructor_id' => $instructor->id,
            'category_id' => $category->id,
            'title' => 'Laravel Fundamentals',
            'slug' => 'laravel-fundamentals',
            'short_description' => 'Build reliable Laravel applications.',
            'description' => 'A complete introduction to Laravel development.',
            'level' => 'beginner',
            'language' => 'English',
            'duration' => 180,
            'price' => 0,
            'currency' => 'USD',
            'type' => 'free',
            'status' => 'draft',
        ], $overrides));
    }

    private function coursePayload(Category $category): array
    {
        return [
            'category_id' => $category->id,
            'title' => 'Authorization Course',
            'short_description' => 'A course used to verify authorization boundaries.',
            'description' => 'Only approved instructors may create this course.',
            'level' => 'beginner',
            'language' => 'English',
            'duration' => 60,
            'type' => 'free',
        ];
    }
}
