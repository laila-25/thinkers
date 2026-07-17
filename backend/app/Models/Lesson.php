<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lesson extends Model
{
    protected $fillable = [
        'course_section_id', 'title', 'slug', 'description', 'text_content', 'content_type',
        'duration', 'position', 'is_preview', 'is_published', 'content_updated_at',
    ];

    protected function casts(): array
    {
        return ['is_preview' => 'boolean', 'is_published' => 'boolean', 'content_updated_at' => 'datetime'];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'course_section_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(Progress::class);
    }

    public function video(): HasOne
    {
        return $this->hasOne(Video::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class)->orderBy('position');
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }
}
