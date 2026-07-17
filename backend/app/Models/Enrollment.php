<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id', 'course_id', 'last_accessed_lesson_id', 'status',
        'enrolled_at', 'completed_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lastAccessedLesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'last_accessed_lesson_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(Progress::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function completionPercentage(): int
    {
        $total = $this->course->sections->sum(fn (CourseSection $section) => $section->lessons->where('is_published', true)->count());
        if ($total === 0) {
            return 0;
        }

        $completed = $this->progress->where('status', 'completed')->count();

        return (int) round(($completed / $total) * 100);
    }
}
