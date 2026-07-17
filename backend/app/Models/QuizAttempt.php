<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    protected $fillable = ['user_id', 'enrollment_id', 'quiz_id', 'attempt_number', 'status', 'score', 'maximum_score', 'percentage', 'passed', 'started_at', 'completed_at'];

    protected function casts(): array
    {
        return ['score' => 'decimal:2', 'maximum_score' => 'decimal:2', 'percentage' => 'decimal:2', 'passed' => 'boolean', 'started_at' => 'datetime', 'completed_at' => 'datetime'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }
    public function quiz(): BelongsTo { return $this->belongsTo(Quiz::class); }
    public function answers(): HasMany { return $this->hasMany(QuizAttemptAnswer::class); }
}
