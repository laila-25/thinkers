<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Progress extends Model
{
    protected $table = 'progress';

    protected $fillable = [
        'enrollment_id', 'lesson_id', 'status', 'completion_percentage',
        'playback_position', 'started_at', 'last_accessed_at', 'completed_at',
        'notes', 'is_bookmarked', 'is_important',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'last_accessed_at' => 'datetime',
            'completed_at' => 'datetime',
            'is_bookmarked' => 'boolean',
            'is_important' => 'boolean',
        ];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
