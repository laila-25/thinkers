<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentEvent extends Model
{
    public const STATUS_PROCESSING = 'processing';

    public const STATUS_PROCESSED = 'processed';

    public const STATUS_IGNORED = 'ignored';

    protected $fillable = [
        'order_id', 'provider', 'event_id', 'type', 'status', 'payload_hash', 'processed_at',
    ];

    protected function casts(): array
    {
        return ['processed_at' => 'datetime'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
