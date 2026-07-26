<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentProgressTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_a_student_can_enroll_once_in_a_published_free_course(): void
    {
        [$student, $course] = $this->studentAndCourse();

        $this->actingAs($student)->postJson("/api/courses/{$course->id}/enroll")
            ->assertCreated()
            ->assertJsonPath('data.status', 'active');

        $this->actingAs($student)->postJson("/api/courses/{$course->id}/enroll")->assertUnprocessable();
        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_unpublished_paid_and_non_student_enrollments_are_rejected(): void
    {
        [$student, $course, $instructor] = $this->studentAndCourse();

        $course->update(['status' => 'draft', 'published_at' => null]);
        $this->actingAs($student)->postJson("/api/courses/{$course->id}/enroll")->assertUnprocessable();

        $course->update(['status' => 'published', 'published_at' => now(), 'type' => 'paid', 'price' => 25]);
        $this->actingAs($student)->postJson("/api/courses/{$course->id}/enroll")->assertUnprocessable();

        $course->update(['type' => 'free', 'price' => 0]);
        $this->actingAs($instructor)->postJson("/api/courses/{$course->id}/enroll")->assertUnprocessable();
    }

    public function test_students_can_only_view_their_own_enrollments(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $other = User::factory()->create();
        $other->assignRole('student');
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($student)->getJson("/api/enrollments/{$enrollment->id}/progress")->assertOk();
        $this->actingAs($other)->getJson("/api/enrollments/{$enrollment->id}/progress")->assertForbidden();
    }

    public function test_enrollment_list_returns_lightweight_summary_data(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Start Here', 'position' => 1]);
        $first = $this->lesson($section, 'Introduction', 1);
        $this->lesson($section, 'Next Steps', 2);
        $enrollment = Enrollment::create([
            'user_id' => $student->id, 'course_id' => $course->id,
            'last_accessed_lesson_id' => $first->id, 'status' => 'active', 'enrolled_at' => now(),
        ]);
        $enrollment->progress()->create([
            'lesson_id' => $first->id, 'status' => 'completed', 'completion_percentage' => 100,
        ]);

        $this->actingAs($student)->getJson('/api/enrollments')
            ->assertOk()
            ->assertJsonPath('data.0.id', $enrollment->id)
            ->assertJsonPath('data.0.course.id', $course->id)
            ->assertJsonPath('data.0.course.title', $course->title)
            ->assertJsonPath('data.0.course.instructor.name', $course->instructor->name)
            ->assertJsonPath('data.0.course.category.name', $course->category->name)
            ->assertJsonPath('data.0.completion_percentage', 50)
            ->assertJsonPath('data.0.last_accessed_lesson.id', $first->id)
            ->assertJsonMissingPath('data.0.sections')
            ->assertJsonMissingPath('data.0.course.description');
    }

    public function test_course_player_still_returns_full_curriculum_and_remains_authorized(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $other = User::factory()->create();
        $other->assignRole('student');
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Start Here', 'position' => 1]);
        $lesson = $this->lesson($section, 'Introduction', 1);
        $enrollment = Enrollment::create([
            'user_id' => $student->id, 'course_id' => $course->id,
            'status' => 'active', 'enrolled_at' => now(),
        ]);

        $this->actingAs($student)->getJson("/api/learning/enrollments/{$enrollment->id}")
            ->assertOk()
            ->assertJsonPath('data.sections.0.id', $section->id)
            ->assertJsonPath('data.sections.0.lessons.0.id', $lesson->id)
            ->assertJsonPath('data.course.id', $course->id);

        $this->actingAs($other)->getJson("/api/learning/enrollments/{$enrollment->id}")
            ->assertForbidden();
    }

    public function test_summary_response_is_materially_smaller_than_course_player_response(): void
    {
        [$student, $course] = $this->studentAndCourse();
        foreach (range(1, 4) as $sectionPosition) {
            $section = CourseSection::create(['course_id' => $course->id, 'title' => "Section {$sectionPosition}", 'position' => $sectionPosition]);
            foreach (range(1, 5) as $lessonPosition) {
                $this->lesson($section, "Lesson {$sectionPosition}-{$lessonPosition}", $lessonPosition);
            }
        }
        $enrollment = Enrollment::create([
            'user_id' => $student->id, 'course_id' => $course->id,
            'status' => 'active', 'enrolled_at' => now(),
        ]);

        $summaryBytes = strlen($this->actingAs($student)->getJson('/api/enrollments')->getContent());
        $playerBytes = strlen($this->actingAs($student)->getJson("/api/learning/enrollments/{$enrollment->id}")->getContent());

        $this->assertLessThan($playerBytes * 0.4, $summaryBytes);
    }

    public function test_lesson_progress_updates_percentage_last_lesson_and_completion(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Start Here', 'position' => 1]);
        $first = $this->lesson($section, 'Introduction', 1);
        $second = $this->lesson($section, 'Next Steps', 2);
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($student)->putJson("/api/enrollments/{$enrollment->id}/lessons/{$first->id}/progress", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('data.completion_percentage', 50)
            ->assertJsonPath('data.last_accessed_lesson_id', $first->id);

        $this->actingAs($student)->putJson("/api/enrollments/{$enrollment->id}/lessons/{$second->id}/progress", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('data.completion_percentage', 100)
            ->assertJsonPath('data.status', 'completed');

        $this->assertNotNull($enrollment->fresh()->completed_at);
    }

    public function test_students_can_save_private_lesson_interactions_only_for_their_enrollment(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Notes', 'position' => 1]);
        $lesson = $this->lesson($section, 'Important Lesson', 1);
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $other = User::factory()->create();
        $other->assignRole('student');

        $this->actingAs($student)->patchJson("/api/enrollments/{$enrollment->id}/lessons/{$lesson->id}/interaction", [
            'notes' => 'Remember this concept.',
            'is_bookmarked' => true,
            'is_important' => true,
        ])->assertOk()
            ->assertJsonPath('data.notes', 'Remember this concept.')
            ->assertJsonPath('data.is_bookmarked', true)
            ->assertJsonPath('data.is_important', true);

        $this->actingAs($other)->patchJson("/api/enrollments/{$enrollment->id}/lessons/{$lesson->id}/interaction", [
            'notes' => 'Unauthorized change',
        ])->assertForbidden();

        $this->actingAs($student)->getJson("/api/learning/enrollments/{$enrollment->id}")
            ->assertJsonPath('data.sections.0.lessons.0.progress.notes', 'Remember this concept.');
    }

    public function test_completed_enrollment_rejects_progress_writes_but_allows_private_interactions(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Completed', 'position' => 1]);
        $lesson = $this->lesson($section, 'Finished Lesson', 1);
        $enrollment = Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'completed',
            'enrolled_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($student)->putJson("/api/enrollments/{$enrollment->id}/lessons/{$lesson->id}/progress", [
            'status' => 'completed',
            'completion_percentage' => 100,
        ])->assertForbidden();

        $this->actingAs($student)->patchJson("/api/enrollments/{$enrollment->id}/lessons/{$lesson->id}/interaction", [
            'notes' => 'Review after completion.',
            'is_bookmarked' => true,
        ])->assertOk()
            ->assertJsonPath('data.notes', 'Review after completion.')
            ->assertJsonPath('data.is_bookmarked', true);
    }

    public function test_active_enrollment_can_be_cancelled_with_partial_progress_but_completed_cannot(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Start Here', 'position' => 1]);
        $lesson = $this->lesson($section, 'Introduction', 1);
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($student)->putJson("/api/enrollments/{$enrollment->id}/lessons/{$lesson->id}/progress", [
            'status' => 'in_progress',
            'completion_percentage' => 45,
        ])->assertOk();

        $this->actingAs($student)->patchJson("/api/enrollments/{$enrollment->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $completed = Enrollment::whereKey($enrollment->id)->first();
        $completed->update(['status' => 'completed', 'completed_at' => now(), 'cancelled_at' => null]);
        $this->actingAs($student)->patchJson("/api/enrollments/{$completed->id}/cancel")->assertForbidden();
    }

    public function test_only_the_course_instructor_or_admin_can_view_statistics(): void
    {
        [, $course, $instructor] = $this->studentAndCourse();
        $otherInstructor = User::factory()->create(['instructor_status' => 'approved']);
        $otherInstructor->assignRole('instructor');
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($instructor)->getJson("/api/manage/courses/{$course->id}/enrollment-statistics")->assertOk();
        $this->actingAs($otherInstructor)->getJson("/api/manage/courses/{$course->id}/enrollment-statistics")->assertForbidden();
        $this->actingAs($admin)->getJson("/api/manage/courses/{$course->id}/enrollment-statistics")->assertOk();
    }

    private function studentAndCourse(): array
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        $instructor = User::factory()->create(['instructor_status' => 'approved']);
        $instructor->assignRole('instructor');
        $category = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        $course = Course::create([
            'instructor_id' => $instructor->id, 'category_id' => $category->id,
            'title' => 'Laravel', 'slug' => 'laravel', 'short_description' => 'Learn Laravel.',
            'description' => 'Laravel course.', 'level' => 'beginner', 'language' => 'English',
            'duration' => 120, 'price' => 0, 'currency' => 'USD', 'type' => 'free',
            'status' => 'published', 'published_at' => now(),
        ]);

        return [$student, $course, $instructor];
    }

    private function lesson(CourseSection $section, string $title, int $position): Lesson
    {
        return Lesson::create([
            'course_section_id' => $section->id, 'title' => $title,
            'slug' => str($title)->slug(), 'content_type' => 'video',
            'duration' => 10, 'position' => $position, 'is_published' => true,
        ]);
    }
}
