<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Course extends Model
{
    protected $fillable = [
        'instructor_id', 'category_id', 'title', 'subtitle', 'slug', 'short_description', 'description',
        'learning_objectives', 'requirements', 'target_audience', 'thumbnail', 'promotional_video_path',
        'level', 'language', 'duration', 'price', 'currency', 'type', 'status',
        'reviewed_by', 'reviewed_at', 'rejection_reason', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'learning_objectives' => 'array',
            'requirements' => 'array',
            'target_audience' => 'array',
            'reviewed_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('position');
    }

    public function lessons(): HasManyThrough
    {
        return $this->hasManyThrough(Lesson::class, CourseSection::class, 'course_id', 'course_section_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function instructorEarnings(): HasMany
    {
        return $this->hasMany(InstructorEarning::class);
    }

    public function aiConversations(): HasMany
    {
        return $this->hasMany(AIConversation::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')->whereNotNull('published_at');
    }
}
