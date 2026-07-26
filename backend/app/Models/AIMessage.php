<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIMessage extends Model
{
    protected $table = 'ai_messages';

    public const UPDATED_AT = null;

    protected $fillable = ['conversation_id', 'role', 'content', 'tokens_used'];

    protected function casts(): array
    {
        return ['tokens_used' => 'integer'];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AIConversation::class, 'conversation_id');
    }
}
