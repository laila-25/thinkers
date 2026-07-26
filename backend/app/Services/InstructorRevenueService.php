<?php

namespace App\Services;

use App\Models\InstructorEarning;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class InstructorRevenueService
{
    public function createForPaidOrder(Order $order): InstructorEarning
    {
        return DB::transaction(function () use ($order): InstructorEarning {
            $lockedOrder = Order::query()
                ->with('course:id,instructor_id,price,currency')
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($lockedOrder->status !== Order::STATUS_PAID) {
                throw new \LogicException('Earnings can only be created for paid orders.');
            }

            $existing = InstructorEarning::query()->where('order_id', $lockedOrder->id)->first();
            if ($existing) {
                return $existing;
            }

            $grossCents = (int) round(((float) $lockedOrder->course->price) * 100);
            $feeBasisPoints = (int) config('marketplace.platform_fee_basis_points', 2000);
            $feeCents = (int) round($grossCents * $feeBasisPoints / 10000);

            return InstructorEarning::create([
                'instructor_id' => $lockedOrder->course->instructor_id,
                'order_id' => $lockedOrder->id,
                'course_id' => $lockedOrder->course_id,
                'gross_amount' => $this->money($grossCents),
                'platform_fee' => $this->money($feeCents),
                'instructor_amount' => $this->money($grossCents - $feeCents),
                'currency' => strtoupper($lockedOrder->course->currency),
                'status' => InstructorEarning::STATUS_PENDING,
            ]);
        });
    }

    private function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
