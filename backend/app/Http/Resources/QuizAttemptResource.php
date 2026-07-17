<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'quiz_id' => $this->quiz_id, 'attempt_number' => $this->attempt_number,
            'status' => $this->status, 'score' => $this->when($this->status !== 'in_progress', $this->score),
            'maximum_score' => $this->maximum_score,
            'percentage' => $this->when($this->status !== 'in_progress', $this->percentage),
            'passed' => $this->when($this->status !== 'in_progress', $this->passed),
            'started_at' => $this->started_at, 'completed_at' => $this->completed_at,
            'expires_at' => $this->quiz?->time_limit_minutes ? $this->started_at->copy()->addMinutes($this->quiz->time_limit_minutes) : null,
            'quiz' => $this->when($this->status === 'in_progress' && $this->relationLoaded('quiz'), fn () => new StudentQuizResource($this->quiz)),
        ];
    }
}
