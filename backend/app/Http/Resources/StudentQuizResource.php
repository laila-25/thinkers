<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentQuizResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $attemptCount = $user ? $this->attempts()->where('user_id', $user->id)->count() : 0;
        return [
            'id' => $this->id, 'lesson_id' => $this->lesson_id, 'title' => $this->title,
            'description' => $this->description, 'passing_score_percentage' => $this->passing_score_percentage,
            'maximum_attempts' => $this->maximum_attempts, 'attempts_used' => $attemptCount,
            'attempts_remaining' => max(0, $this->maximum_attempts - $attemptCount),
            'time_limit_minutes' => $this->time_limit_minutes,
            'questions' => $this->whenLoaded('questions', fn () => $this->questions->map(fn ($question) => [
                'id' => $question->id, 'question_text' => $question->question_text,
                'question_type' => $question->question_type, 'points' => $question->points, 'position' => $question->position,
                'options' => $question->answers->map(fn ($answer) => [
                    'id' => $answer->id, 'option_text' => $answer->option_text, 'position' => $answer->position,
                ]),
            ])),
        ];
    }
}
