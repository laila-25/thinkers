<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class XpTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'points', 'reason', 'reward_key', 'metadata', 'awarded_at'];

    protected function casts(): array
    {
        return ['points' => 'integer', 'metadata' => 'array', 'awarded_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
