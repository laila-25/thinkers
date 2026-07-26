<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    protected $fillable = ['key', 'name', 'description', 'icon'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('unlocked_at');
    }
}
