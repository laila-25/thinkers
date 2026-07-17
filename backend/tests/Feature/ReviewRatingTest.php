<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Progress;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewRatingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_only_enrolled_students_with_meaningful_activity_can_review(): void
    {
        [$student, $course, , $lessons] = $this->fixture();
        $this->actingAs($student)->postJson("/api/courses/{$course->id}/reviews", $this->payload())->assertUnprocessable();
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $this->actingAs($student)->postJson("/api/courses/{$course->id}/reviews", $this->payload())->assertUnprocessable();
        $enrollment->update(['last_accessed_lesson_id' => $lessons[0]->id]);
        Progress::create(['enrollment_id' => $enrollment->id, 'lesson_id' => $lessons[0]->id, 'status' => 'completed', 'completion_percentage' => 100, 'completed_at' => now()]);
        $this->actingAs($student)->postJson("/api/courses/{$course->id}/reviews", $this->payload())->assertCreated()->assertJsonPath('data.rating', 5);
    }

    public function test_duplicate_reviews_are_prevented_but_owner_can_update_and_delete(): void
    {
        [$student, $course] = $this->fixture();
        $review = Review::create($this->payload() + ['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'published']);
        $this->actingAs($student)->postJson("/api/courses/{$course->id}/reviews", $this->payload())->assertUnprocessable();
        $this->actingAs($student)->putJson("/api/reviews/{$review->id}", ['rating' => 4, 'review_text' => 'Updated and still very useful.'])->assertOk()->assertJsonPath('data.rating', 4);
        $other = User::factory()->create();
        $other->assignRole('student');
        $this->actingAs($other)->putJson("/api/reviews/{$review->id}", ['rating' => 1, 'review_text' => 'Unauthorized update text.'])->assertForbidden();
        $this->actingAs($student)->deleteJson("/api/reviews/{$review->id}")->assertNoContent();
    }

    public function test_public_statistics_are_accurate_and_exclude_hidden_reviews(): void
    {
        [$student, $course] = $this->fixture();
        $second = User::factory()->create();
        $third = User::factory()->create();
        Review::create(['user_id' => $student->id, 'course_id' => $course->id, 'rating' => 5, 'review_text' => 'Excellent course content.', 'status' => 'published']);
        Review::create(['user_id' => $second->id, 'course_id' => $course->id, 'rating' => 3, 'review_text' => 'A solid learning course.', 'status' => 'published']);
        Review::create(['user_id' => $third->id, 'course_id' => $course->id, 'rating' => 1, 'review_text' => 'This review is hidden.', 'status' => 'hidden']);
        $this->getJson("/api/courses/{$course->id}/rating")->assertOk()->assertJsonPath('data.average_rating', 4)->assertJsonPath('data.review_count', 2)->assertJsonPath('data.distribution.5', 1)->assertJsonPath('data.distribution.3', 1);
        $this->getJson("/api/courses/{$course->id}/reviews")->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_only_course_owner_or_admin_can_view_and_moderate_reviews(): void
    {
        [$student, $course, $instructor] = $this->fixture();
        $review = Review::create($this->payload() + ['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'published']);
        $otherInstructor = User::factory()->create(['instructor_status' => 'approved']);
        $otherInstructor->assignRole('instructor');
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $this->actingAs($instructor)->getJson("/api/manage/courses/{$course->id}/reviews")->assertOk();
        $this->actingAs($otherInstructor)->getJson("/api/manage/courses/{$course->id}/reviews")->assertForbidden();
        $this->actingAs($admin)->patchJson("/api/admin/reviews/{$review->id}", ['status' => 'hidden'])->assertOk()->assertJsonPath('data.status', 'hidden');
        $this->getJson("/api/courses/{$course->id}/reviews")->assertJsonCount(0, 'data');
    }

    private function fixture(): array
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        $instructor = User::factory()->create(['instructor_status' => 'approved']);
        $instructor->assignRole('instructor');
        $category = Category::create(['name' => 'Reviews', 'slug' => 'reviews']);
        $course = Course::create(['instructor_id' => $instructor->id, 'category_id' => $category->id, 'title' => 'Reviewed Course', 'slug' => 'reviewed-course', 'short_description' => 'A reviewable course.', 'description' => 'Course description.', 'level' => 'beginner', 'language' => 'English', 'duration' => 100, 'price' => 0, 'currency' => 'USD', 'type' => 'free', 'status' => 'published', 'published_at' => now()]);
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Lessons', 'position' => 1]);
        $lessons = collect(range(1, 5))->map(fn ($position) => Lesson::create(['course_section_id' => $section->id, 'title' => "Lesson {$position}", 'slug' => "lesson-{$position}", 'content_type' => 'text', 'position' => $position, 'is_published' => true]));
        return [$student, $course, $instructor, $lessons];
    }

    private function payload(): array
    {
        return ['rating' => 5, 'review_text' => 'A genuinely useful learning experience.'];
    }
}
