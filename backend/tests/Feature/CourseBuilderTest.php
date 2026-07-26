<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CourseBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_owner_can_update_and_preview_a_draft_without_publishing_it(): void
    {
        [$owner, $course] = $this->fixture();

        $this->actingAs($owner)->patchJson("/api/manage/courses/{$course->id}/builder", [
            'subtitle' => 'Build secure applications',
            'description' => '<p onclick="bad()">Safe</p><script>alert(1)</script>',
            'learning_objectives' => ['Apply authorization'],
            'requirements' => ['PHP fundamentals'],
            'target_audience' => ['Laravel developers'],
        ])->assertOk()->assertJsonPath('data.course.subtitle', 'Build secure applications');
        $this->assertSame('<p>Safe</p>', $course->fresh()->description);

        $this->actingAs($owner)->getJson("/api/manage/courses/{$course->id}/preview")
            ->assertOk()->assertJsonPath('data.course.status', 'draft');
        $this->assertSame('draft', $course->fresh()->status);
    }

    public function test_another_instructor_cannot_access_or_modify_the_builder(): void
    {
        [, $course] = $this->fixture();
        $intruder = $this->instructor();

        $this->actingAs($intruder)->getJson("/api/manage/courses/{$course->id}/builder")->assertForbidden();
        $this->actingAs($intruder)->patchJson("/api/manage/courses/{$course->id}/builder", ['title' => 'Stolen'])->assertForbidden();
        $this->actingAs($intruder)->postJson("/api/manage/courses/{$course->id}/thumbnail", [])->assertForbidden();
    }

    public function test_curriculum_reorder_requires_the_exact_owned_items(): void
    {
        [$owner, $course] = $this->fixture();
        $first = CourseSection::create(['course_id' => $course->id, 'title' => 'First', 'position' => 1]);
        $second = CourseSection::create(['course_id' => $course->id, 'title' => 'Second', 'position' => 2]);

        $this->actingAs($owner)->putJson("/api/manage/courses/{$course->id}/sections/reorder", [
            'ids' => [$second->id, $first->id],
        ])->assertNoContent();
        $this->assertSame([$second->id, $first->id], $course->sections()->pluck('id')->all());

        $this->actingAs($owner)->putJson("/api/manage/courses/{$course->id}/sections/reorder", [
            'ids' => [$first->id],
        ])->assertUnprocessable();
    }

    public function test_submit_requires_complete_curriculum_and_locks_the_course(): void
    {
        Storage::fake('public');
        [$owner, $course] = $this->fixture();

        $this->actingAs($owner)->postJson("/api/manage/courses/{$course->id}/submit")->assertUnprocessable();
        $this->actingAs($owner)->postJson("/api/manage/courses/{$course->id}/thumbnail", [
            'thumbnail' => UploadedFile::fake()->createWithContent(
                'course.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
            ),
        ])->assertOk();
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Start', 'position' => 1]);
        Lesson::create(['course_section_id' => $section->id, 'title' => 'Welcome', 'slug' => 'welcome', 'content_type' => 'text', 'duration' => 5, 'position' => 1]);

        $this->actingAs($owner)->postJson("/api/manage/courses/{$course->id}/submit")
            ->assertOk()->assertJsonPath('data.status', 'pending_review');
        $this->actingAs($owner)->patchJson("/api/manage/courses/{$course->id}/builder", ['title' => 'Locked'])->assertForbidden();
    }

    public function test_published_course_is_locked(): void
    {
        [$owner, $course] = $this->fixture();
        $course->update(['status' => 'published', 'published_at' => now()]);

        $this->actingAs($owner)->patchJson("/api/manage/courses/{$course->id}/builder", ['title' => 'Changed'])->assertForbidden();
    }

    private function fixture(): array
    {
        $owner = $this->instructor();
        $category = Category::create(['name' => 'Programming', 'slug' => 'programming', 'is_active' => true]);
        $course = Course::create([
            'instructor_id' => $owner->id, 'category_id' => $category->id, 'title' => 'Laravel Security',
            'slug' => 'laravel-security-'.uniqid(), 'short_description' => 'A practical secure Laravel course.',
            'description' => '<p>Build secure Laravel applications.</p>', 'level' => 'intermediate',
            'language' => 'English', 'duration' => 0, 'price' => 0, 'currency' => 'USD',
            'type' => 'free', 'status' => 'draft',
        ]);

        return [$owner, $course];
    }

    private function instructor(): User
    {
        $user = User::factory()->create(['instructor_status' => 'approved', 'email_verified_at' => now()]);
        $user->assignRole('instructor');

        return $user;
    }
}
