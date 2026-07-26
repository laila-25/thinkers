<?php

namespace App\Services;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizAttemptService
{
    public function __construct(private readonly ProgressService $progressService, private readonly GamificationService $gamification) {}

    public function start(User $user, Quiz $quiz): QuizAttempt
    {
        $quiz->loadMissing('lesson.section.course', 'questions.answers');
        $course = $quiz->lesson->section->course;
        if (! $user->hasRole('student') || $quiz->status !== 'published' || ! $quiz->lesson->is_published || $course->status !== 'published') {
            throw ValidationException::withMessages(['quiz' => 'This assessment is not available.']);
        }
        $enrollment = $user->enrollments()->where('course_id', $course->id)->where('status', 'active')->first();
        if (! $enrollment) {
            throw ValidationException::withMessages(['enrollment' => 'An active enrollment is required.']);
        }

        return DB::transaction(function () use ($user, $quiz, $enrollment): QuizAttempt {
            $lockedQuiz = Quiz::whereKey($quiz->id)->lockForUpdate()->firstOrFail();
            $attempts = QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $user->id)->lockForUpdate()->get();
            $active = $attempts->firstWhere('status', 'in_progress');
            if ($active && ! $this->isExpired($active, $lockedQuiz)) {
                throw ValidationException::withMessages(['attempt' => 'Complete the current attempt before starting another.']);
            }
            if ($active) {
                $active->update(['status' => 'expired', 'completed_at' => now()]);
            }
            if ($attempts->count() >= $lockedQuiz->maximum_attempts) {
                throw ValidationException::withMessages(['attempt' => 'The maximum number of attempts has been reached.']);
            }

            return QuizAttempt::create([
                'user_id' => $user->id, 'enrollment_id' => $enrollment->id, 'quiz_id' => $quiz->id,
                'attempt_number' => $attempts->count() + 1, 'status' => 'in_progress',
                'maximum_score' => $quiz->questions->sum(fn ($question) => (float) $question->points), 'started_at' => now(),
            ]);
        });
    }

    public function submit(QuizAttempt $attempt, array $submittedAnswers): QuizAttempt
    {
        return DB::transaction(function () use ($attempt, $submittedAnswers): QuizAttempt {
            $attempt = QuizAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();
            if ($attempt->status !== 'in_progress') {
                throw ValidationException::withMessages(['attempt' => 'This attempt has already been finalized.']);
            }
            $quiz = $attempt->quiz()->with('lesson.section.course', 'questions.answers')->firstOrFail();
            if ($this->isExpired($attempt, $quiz)) {
                $attempt->update(['status' => 'expired', 'completed_at' => now()]);

                return $attempt->fresh('quiz');
            }
            $submitted = collect($submittedAnswers)->keyBy('question_id');
            $validQuestionIds = $quiz->questions->pluck('id');
            if ($submitted->keys()->diff($validQuestionIds)->isNotEmpty()) {
                throw ValidationException::withMessages(['answers' => 'One or more submitted questions do not belong to this quiz.']);
            }
            $score = 0.0;
            foreach ($quiz->questions as $question) {
                $answerId = $submitted->get($question->id)['answer_id'] ?? null;
                $selected = $answerId ? $question->answers->firstWhere('id', (int) $answerId) : null;
                if ($answerId && ! $selected) {
                    throw ValidationException::withMessages(['answers' => 'An answer does not belong to its question.']);
                }
                $correct = (bool) $selected?->is_correct;
                $awarded = $correct ? (float) $question->points : 0.0;
                $score += $awarded;
                $attempt->answers()->create(['question_id' => $question->id, 'answer_id' => $selected?->id, 'is_correct' => $correct, 'awarded_points' => $awarded]);
            }
            $maximum = (float) $attempt->maximum_score;
            $percentage = $maximum > 0 ? round(($score / $maximum) * 100, 2) : 0;
            $passed = $percentage >= $quiz->passing_score_percentage;
            $attempt->update(['status' => 'submitted', 'score' => $score, 'percentage' => $percentage, 'passed' => $passed, 'completed_at' => now()]);
            $this->progressService->recordQuizResult($attempt->enrollment, $quiz->lesson, $passed, (int) round($percentage));
            if ($passed) {
                $this->gamification->recordQuizPass($attempt->user, $quiz->id);
            }

            return $attempt->fresh(['quiz', 'answers.question', 'answers.selectedAnswer']);
        });
    }

    private function isExpired(QuizAttempt $attempt, Quiz $quiz): bool
    {
        return $quiz->time_limit_minutes !== null && now()->greaterThan($attempt->started_at->copy()->addMinutes($quiz->time_limit_minutes));
    }
}
