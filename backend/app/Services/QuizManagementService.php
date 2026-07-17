<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizManagementService
{
    public function create(Lesson $lesson, array $data): Quiz
    {
        if ($lesson->content_type !== 'quiz') throw ValidationException::withMessages(['lesson' => 'A quiz can only be attached to a quiz lesson.']);
        if ($lesson->quiz()->exists()) throw ValidationException::withMessages(['lesson' => 'This lesson already has a quiz.']);
        return $lesson->quiz()->create($data + ['status' => 'draft']);
    }

    public function update(Quiz $quiz, array $data): Quiz
    {
        $this->ensureMutable($quiz);
        $quiz->update($data);
        return $quiz->fresh('questions.answers');
    }

    public function saveQuestion(Quiz $quiz, array $data, ?Question $question = null): Question
    {
        $this->ensureMutable($quiz);
        if ($question && $question->quiz_id !== $quiz->id) throw ValidationException::withMessages(['question' => 'Question does not belong to this quiz.']);
        return DB::transaction(function () use ($quiz, $data, $question): Question {
            $options = $data['options'];
            unset($data['options']);
            if ($question) {
                $question->update($data);
                $question->answers()->delete();
            } else {
                $question = $quiz->questions()->create($data);
            }
            $question->answers()->createMany($options);
            return $question->fresh('answers');
        });
    }

    public function deleteQuestion(Question $question): void
    {
        $this->ensureMutable($question->quiz);
        $question->delete();
    }

    public function reorder(Quiz $quiz, array $ids): Quiz
    {
        $this->ensureMutable($quiz);
        $actual = $quiz->questions()->pluck('id')->sort()->values()->all();
        $provided = collect($ids)->sort()->values()->all();
        if ($actual !== $provided) throw ValidationException::withMessages(['question_ids' => 'Every quiz question must appear exactly once.']);
        DB::transaction(function () use ($ids): void {
            foreach ($ids as $index => $id) Question::whereKey($id)->update(['position' => 100000 + $index]);
            foreach ($ids as $index => $id) Question::whereKey($id)->update(['position' => $index + 1]);
        });
        return $quiz->fresh('questions.answers');
    }

    public function publish(Quiz $quiz): Quiz
    {
        $this->ensureMutable($quiz);
        $quiz->load('questions.answers');
        if ($quiz->questions->isEmpty()) throw ValidationException::withMessages(['quiz' => 'Add at least one question before publishing.']);
        foreach ($quiz->questions as $question) {
            if ($question->answers->count() < 2 || $question->answers->where('is_correct', true)->count() !== 1) {
                throw ValidationException::withMessages(['quiz' => 'Every question must have valid answer options and one correct answer.']);
            }
        }
        $quiz->update(['status' => 'published']);
        return $quiz->fresh('questions.answers');
    }

    public function ensureMutable(Quiz $quiz): void
    {
        if ($quiz->attempts()->exists()) throw ValidationException::withMessages(['quiz' => 'Assessment structure cannot change after an attempt has started.']);
    }
}
