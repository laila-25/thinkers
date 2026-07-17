<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = ['user_id', 'course_id', 'rating', 'review_text', 'status'];

    protected function casts(): array { return ['rating' => 'integer']; }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function scopePublished(Builder $query): Builder { return $query->where('status', 'published'); }
}
