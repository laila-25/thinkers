<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class QuizAssessmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void { parent::setUp(); $this->seed(RolePermissionSeeder::class); }

    public function test_only_owner_can_manage_quiz_and_structure_locks_after_attempt(): void
    {
        [$owner, $student, $course, $lesson, $quiz, $question] = $this->fixture(false);
        $other = User::factory()->create(['instructor_status' => 'approved']); $other->assignRole('instructor');
        $this->actingAs($other)->putJson("/api/manage/quizzes/{$quiz->id}", ['title' => 'No'])->assertForbidden();
        $this->actingAs($owner)->putJson("/api/manage/quizzes/{$quiz->id}", ['title' => 'Updated'])->assertOk();

        $course->update(['status' => 'published', 'published_at' => now()]); $lesson->update(['is_published' => true]); $quiz->update(['status' => 'published']);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $this->actingAs($student)->postJson("/api/learning/quizzes/{$quiz->id}/attempts")->assertCreated();
        $course->update(['status' => 'draft', 'published_at' => null]);
        $this->actingAs($owner)->putJson("/api/manage/questions/{$question->id}", $this->questionPayload())->assertUnprocessable();
    }

    public function test_student_payload_never_leaks_correct_answers_and_requires_enrollment(): void
    {
        [, $student, $course, $lesson, $quiz] = $this->fixture(true);
        $lesson->update(['is_preview' => true]);
        $this->actingAs($student)->getJson("/api/learning/lessons/{$lesson->id}/quiz")->assertForbidden();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $response = $this->actingAs($student)->getJson("/api/learning/lessons/{$lesson->id}/quiz")->assertOk();
        $this->assertStringNotContainsString('is_correct', $response->getContent());
        $start = $this->actingAs($student)->postJson("/api/learning/quizzes/{$quiz->id}/attempts")->assertCreated();
        $this->assertStringNotContainsString('is_correct', $start->getContent());
    }

    public function test_server_grading_rejects_injected_answers_and_passing_completes_progress(): void
    {
        [, $student, $course, , $quiz, $question, $correct] = $this->fixture(true);
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $attemptId = $this->actingAs($student)->postJson("/api/learning/quizzes/{$quiz->id}/attempts")->json('data.id');
        $foreign = Answer::create(['question_id' => Question::create(['quiz_id' => $quiz->id, 'question_text' => 'Other', 'question_type' => 'true_false', 'points' => 1, 'position' => 2])->id, 'option_text' => 'Yes', 'is_correct' => true, 'position' => 1]);
        $this->actingAs($student)->postJson("/api/learning/quiz-attempts/{$attemptId}/submit", ['answers' => [['question_id' => $question->id, 'answer_id' => $foreign->id]]])->assertUnprocessable();
        $result = $this->actingAs($student)->postJson("/api/learning/quiz-attempts/{$attemptId}/submit", ['answers' => [['question_id' => $question->id, 'answer_id' => $correct->id]]])->assertOk();
        $result->assertJsonPath('data.passed', true)->assertJsonPath('data.percentage', '100.00');
        $this->assertDatabaseHas('progress', ['enrollment_id' => $enrollment->id, 'lesson_id' => $quiz->lesson_id, 'status' => 'completed']);
        $this->assertStringNotContainsString('is_correct', $result->getContent());
    }

    public function test_failed_attempt_does_not_complete_lesson_and_attempt_limit_is_enforced(): void
    {
        [, $student, $course, , $quiz, $question, , $wrong] = $this->fixture(true, 1);
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $attemptId = $this->actingAs($student)->postJson("/api/learning/quizzes/{$quiz->id}/attempts")->json('data.id');
        $this->actingAs($student)->postJson("/api/learning/quiz-attempts/{$attemptId}/submit", ['answers' => [['question_id' => $question->id, 'answer_id' => $wrong->id]]])->assertOk()->assertJsonPath('data.passed', false);
        $this->assertDatabaseHas('progress', ['enrollment_id' => $enrollment->id, 'status' => 'in_progress']);
        $this->actingAs($student)->postJson("/api/learning/quizzes/{$quiz->id}/attempts")->assertUnprocessable();
    }

    public function test_time_limit_is_enforced_by_the_server(): void
    {
        [, $student, $course, , $quiz, $question, $correct] = $this->fixture(true, 2, 1);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $attemptId = $this->actingAs($student)->postJson("/api/learning/quizzes/{$quiz->id}/attempts")->json('data.id');
        Carbon::setTestNow(now()->addMinutes(2));
        $this->actingAs($student)->postJson("/api/learning/quiz-attempts/{$attemptId}/submit", ['answers' => [['question_id' => $question->id, 'answer_id' => $correct->id]]])->assertOk()->assertJsonPath('data.status', 'expired');
        Carbon::setTestNow();
        $this->assertDatabaseMissing('progress', ['enrollment_id' => Enrollment::first()->id, 'status' => 'completed']);
    }

    public function test_an_active_attempt_can_be_retrieved_for_resume_without_answer_leakage(): void
    {
        [, $student, $course, , $quiz] = $this->fixture(true);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $this->actingAs($student)->postJson("/api/learning/quizzes/{$quiz->id}/attempts")->assertCreated();
        $response = $this->actingAs($student)->getJson("/api/learning/quizzes/{$quiz->id}/attempts")->assertOk();
        $response->assertJsonPath('data.0.status', 'in_progress')->assertJsonPath('data.0.quiz.questions.0.question_text', 'PHP?');
        $this->assertStringNotContainsString('is_correct', $response->getContent());
    }

    private function fixture(bool $published, int $attempts = 2, ?int $time = null): array
    {
        $owner = User::factory()->create(['instructor_status' => 'approved']); $owner->assignRole('instructor');
        $student = User::factory()->create(); $student->assignRole('student');
        $category = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        $course = Course::create(['instructor_id' => $owner->id, 'category_id' => $category->id, 'title' => 'Assessment', 'slug' => 'assessment', 'short_description' => 'Quiz course.', 'description' => 'Quiz.', 'level' => 'beginner', 'language' => 'English', 'duration' => 30, 'price' => 0, 'currency' => 'USD', 'type' => 'free', 'status' => $published ? 'published' : 'draft', 'published_at' => $published ? now() : null]);
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Section', 'position' => 1]);
        $lesson = Lesson::create(['course_section_id' => $section->id, 'title' => 'Quiz', 'slug' => 'quiz', 'content_type' => 'quiz', 'duration' => 5, 'position' => 1, 'is_published' => $published]);
        $quiz = Quiz::create(['lesson_id' => $lesson->id, 'title' => 'Quiz', 'passing_score_percentage' => 70, 'maximum_attempts' => $attempts, 'time_limit_minutes' => $time, 'status' => $published ? 'published' : 'draft']);
        $question = Question::create(['quiz_id' => $quiz->id, 'question_text' => 'PHP?', 'question_type' => 'true_false', 'points' => 2, 'position' => 1]);
        $correct = Answer::create(['question_id' => $question->id, 'option_text' => 'True', 'is_correct' => true, 'position' => 1]);
        $wrong = Answer::create(['question_id' => $question->id, 'option_text' => 'False', 'is_correct' => false, 'position' => 2]);
        return [$owner, $student, $course, $lesson, $quiz, $question, $correct, $wrong];
    }

    private function questionPayload(): array { return ['question_text' => 'Changed', 'question_type' => 'true_false', 'points' => 1, 'position' => 1, 'options' => [['option_text' => 'T', 'is_correct' => true, 'position' => 1], ['option_text' => 'F', 'is_correct' => false, 'position' => 2]]]; }
}
