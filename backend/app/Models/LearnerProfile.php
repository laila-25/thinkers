<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearnerProfile extends Model
{
    protected $fillable = ['user_id', 'total_xp', 'current_streak', 'longest_streak', 'last_activity_date', 'timezone', 'leaderboard_visible'];

    protected function casts(): array
    {
        return ['total_xp' => 'integer', 'current_streak' => 'integer', 'longest_streak' => 'integer', 'last_activity_date' => 'date', 'leaderboard_visible' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
