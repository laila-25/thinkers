<?php

namespace App\Services;

use App\Models\InstructorEarning;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class RevenueReportingService
{
    /** @return array<string, mixed> */
    public function instructor(User $instructor): array
    {
        $query = InstructorEarning::query()->where('instructor_id', $instructor->id);

        return [
            'total_revenue' => $this->money((clone $query)
                ->whereIn('status', [InstructorEarning::STATUS_PENDING, InstructorEarning::STATUS_AVAILABLE, InstructorEarning::STATUS_PAID])
                ->sum('instructor_amount')),
            'pending_earnings' => $this->money((clone $query)
                ->where('status', InstructorEarning::STATUS_PENDING)->sum('instructor_amount')),
            'available_earnings' => $this->money((clone $query)
                ->where('status', InstructorEarning::STATUS_AVAILABLE)->sum('instructor_amount')),
            'sales_count' => (clone $query)->whereNot('status', InstructorEarning::STATUS_CANCELLED)->count(),
            'revenue_history' => $this->history($query),
        ];
    }

    /** @return array<string, mixed> */
    public function admin(): array
    {
        $active = InstructorEarning::query()->whereNot('status', InstructorEarning::STATUS_CANCELLED);
        $start = now()->startOfMonth()->subMonths(11);
        $period = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";
        $monthly = (clone $active)
            ->where('created_at', '>=', $start)
            ->selectRaw("{$period} as period, SUM(gross_amount) as gross, SUM(platform_fee) as platform, SUM(instructor_amount) as instructors, COUNT(*) as sales")
            ->groupByRaw($period)
            ->orderBy('period')
            ->get()
            ->map(fn (InstructorEarning $earning): array => [
                'period' => $earning->getAttribute('period'),
                'total_sales' => (int) $earning->getAttribute('sales'),
                'gross_revenue' => $this->money($earning->getAttribute('gross')),
                'platform_revenue' => $this->money($earning->getAttribute('platform')),
                'instructor_earnings' => $this->money($earning->getAttribute('instructors')),
            ])->values();

        return [
            'total_sales' => (clone $active)->count(),
            'gross_revenue' => $this->money((clone $active)->sum('gross_amount')),
            'platform_revenue' => $this->money((clone $active)->sum('platform_fee')),
            'instructor_earnings' => $this->money((clone $active)->sum('instructor_amount')),
            'monthly_revenue' => $monthly,
        ];
    }

    private function history($query): LengthAwarePaginator
    {
        return $query->with('course:id,title')
            ->latest()
            ->paginate(15)
            ->through(fn (InstructorEarning $earning): array => [
                'id' => $earning->id,
                'course' => ['id' => $earning->course->id, 'title' => $earning->course->title],
                'gross_amount' => $earning->gross_amount,
                'platform_fee' => $earning->platform_fee,
                'instructor_amount' => $earning->instructor_amount,
                'currency' => $earning->currency,
                'status' => $earning->status,
                'created_at' => $earning->created_at?->toISOString(),
            ]);
    }

    private function money(mixed $amount): string
    {
        return number_format((float) $amount, 2, '.', '');
    }
}
