<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'user_id',
        'course_id',
        'amount',
        'currency',
        'status',
        'payment_method',
        'transaction_id',
    ];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function paymentEvents(): HasMany
    {
        return $this->hasMany(PaymentEvent::class);
    }

    public function instructorEarning(): HasOne
    {
        return $this->hasOne(InstructorEarning::class);
    }
}
