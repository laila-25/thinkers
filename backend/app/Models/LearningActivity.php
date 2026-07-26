<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearningActivity extends Model
{
    protected $fillable = ['user_id', 'activity_date', 'events_count'];

    protected function casts(): array
    {
        return ['activity_date' => 'date', 'events_count' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
