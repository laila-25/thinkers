<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    public function test_an_instructor_can_only_update_their_own_editable_course(): void
    {
        $owner = $this->instructor('pending');
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

        $this->actingAs($instructor)->postJson("/api/manage/courses/{$course->id}/submit")->assertOk()->assertJsonPath('data.status', 'pending_review');
        $this->actingAs($admin)->postJson("/api/admin/courses/{$course->id}/approve")->assertUnprocessable();
        $this->actingAs($admin)->patchJson("/api/admin/instructors/{$instructor->id}/status", ['status' => 'approved'])->assertOk();
        $this->actingAs($admin)->postJson("/api/admin/courses/{$course->id}/approve")->assertOk()->assertJsonPath('data.status', 'published');
    }

    public function test_a_student_can_apply_to_become_a_pending_instructor(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($student)
            ->postJson('/api/instructor/apply')
            ->assertOk()
            ->assertJsonPath('user.instructor_status', 'pending')
            ->assertJsonPath('user.roles.0.name', 'instructor');
    }

    public function test_categories_support_a_public_parent_child_hierarchy(): void
    {
        $parent = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        Category::create(['parent_id' => $parent->id, 'name' => 'Web Development', 'slug' => 'web-development']);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.children.0.name', 'Web Development');
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
}
