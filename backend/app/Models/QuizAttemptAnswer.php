<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttemptAnswer extends Model
{
    protected $fillable = ['quiz_attempt_id', 'question_id', 'answer_id', 'is_correct', 'awarded_points'];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean', 'awarded_points' => 'decimal:2'];
    }

    public function attempt(): BelongsTo { return $this->belongsTo(QuizAttempt::class, 'quiz_attempt_id'); }
    public function question(): BelongsTo { return $this->belongsTo(Question::class); }
    public function selectedAnswer(): BelongsTo { return $this->belongsTo(Answer::class, 'answer_id'); }
}
