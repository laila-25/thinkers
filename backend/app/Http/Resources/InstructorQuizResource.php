<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstructorQuizResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'lesson_id' => $this->lesson_id, 'title' => $this->title,
            'description' => $this->description, 'passing_score_percentage' => $this->passing_score_percentage,
            'maximum_attempts' => $this->maximum_attempts, 'time_limit_minutes' => $this->time_limit_minutes,
            'status' => $this->status, 'is_locked' => $this->attempts()->exists(),
            'questions' => $this->whenLoaded('questions', fn () => $this->questions->map(fn ($question) => [
                'id' => $question->id, 'question_text' => $question->question_text,
                'question_type' => $question->question_type, 'points' => $question->points, 'position' => $question->position,
                'options' => $question->answers->map(fn ($answer) => [
                    'id' => $answer->id, 'option_text' => $answer->option_text,
                    'is_correct' => $answer->is_correct, 'position' => $answer->position,
                ]),
            ])),
        ];
    }
}
