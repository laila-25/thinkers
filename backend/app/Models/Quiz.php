<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    protected $fillable = ['lesson_id', 'title', 'description', 'passing_score_percentage', 'maximum_attempts', 'time_limit_minutes', 'status'];

    protected function casts(): array
    {
        return ['passing_score_percentage' => 'integer', 'maximum_attempts' => 'integer', 'time_limit_minutes' => 'integer'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
