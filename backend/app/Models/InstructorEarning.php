<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstructorEarning extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'instructor_id',
        'order_id',
        'course_id',
        'gross_amount',
        'platform_fee',
        'instructor_amount',
        'currency',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'instructor_amount' => 'decimal:2',
        ];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
