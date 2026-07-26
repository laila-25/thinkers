<?php

namespace App\Services;

use App\Models\AIConversation;
use App\Models\AIMessage;
use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    public function dashboard(): array
    {
        return Cache::remember(PerformanceCache::ADMIN_DASHBOARD, PerformanceCache::TTL_SECONDS, fn (): array => [
            'overview' => [
                'total_users' => User::count(),
                'total_students' => User::role('student')->count(),
                'total_instructors' => User::where('instructor_status', 'approved')->count(),
                'pending_instructors' => User::where('instructor_status', 'pending')->count(),
                'total_courses' => Course::count(),
                'published_courses' => Course::published()->count(),
                'total_enrollments' => Enrollment::count(),
                'ai_requests' => AIMessage::where('role', 'assistant')->count(),
            ],
            'charts' => [
                'user_growth' => $this->monthlySeries(User::class),
                'course_creation' => $this->monthlySeries(Course::class),
                'enrollment_trends' => $this->monthlySeries(Enrollment::class),
                'category_distribution' => Category::query()->withCount('courses')->orderByDesc('courses_count')->limit(8)->get()
                    ->map(fn (Category $category) => ['label' => $category->name, 'value' => $category->courses_count])->values(),
                'ai_usage' => $this->dailyAiSeries(),
            ],
            'attention' => [
                'pending_courses' => Course::where('status', 'pending_review')->count(),
                'pending_instructors' => User::where('instructor_status', 'pending')->count(),
            ],
        ]);
    }

    public function aiUsage(): array
    {
        return Cache::remember(PerformanceCache::ADMIN_AI_USAGE, PerformanceCache::TTL_SECONDS, function (): array {
            $usage = AIConversation::query()
                ->join('ai_messages', 'ai_conversations.id', '=', 'ai_messages.conversation_id')
                ->where('ai_messages.role', 'assistant')
                ->selectRaw('ai_conversations.user_id, COUNT(ai_messages.id) as requests, COALESCE(SUM(ai_messages.tokens_used), 0) as tokens')
                ->groupBy('ai_conversations.user_id')
                ->orderByDesc('requests')
                ->limit(10)
                ->get();
            $users = User::whereKey($usage->pluck('user_id'))->get()->keyBy('id');

            return [
                'total_requests' => AIMessage::where('role', 'assistant')->count(),
                'total_tokens' => (int) AIMessage::where('role', 'assistant')->sum('tokens_used'),
                'active_users' => AIConversation::query()
                    ->join('ai_messages', 'ai_conversations.id', '=', 'ai_messages.conversation_id')
                    ->where('ai_messages.role', 'assistant')
                    ->distinct('ai_conversations.user_id')
                    ->count('ai_conversations.user_id'),
                'trend' => $this->dailyAiSeries(),
                'top_users' => $usage->map(fn ($item) => [
                    'id' => $item->user_id,
                    'name' => $users->get($item->user_id)?->name ?? 'Deleted user',
                    'email' => $users->get($item->user_id)?->email,
                    'requests' => (int) $item->requests,
                    'tokens' => (int) $item->tokens,
                ])->values(),
            ];
        });
    }

    private function monthlySeries(string $model): array
    {
        $start = now()->startOfMonth()->subMonths(5);
        $period = $this->datePeriodExpression('created_at', '%Y-%m');
        $counts = $model::query()
            ->where('created_at', '>=', $start)
            ->selectRaw("{$period} as period, COUNT(*) as aggregate")
            ->groupByRaw($period)
            ->pluck('aggregate', 'period');

        return collect(range(0, 5))->map(function (int $offset) use ($counts, $start): array {
            $month = $start->copy()->addMonths($offset);

            return ['label' => $month->format('M'), 'value' => (int) ($counts[$month->format('Y-m')] ?? 0)];
        })->all();
    }

    private function dailyAiSeries(): array
    {
        $start = now()->startOfDay()->subDays(13);
        $period = $this->datePeriodExpression('created_at', '%Y-%m-%d');
        $counts = AIMessage::query()
            ->where('role', 'assistant')
            ->where('created_at', '>=', $start)
            ->selectRaw("{$period} as period, COUNT(*) as aggregate")
            ->groupByRaw($period)
            ->pluck('aggregate', 'period');

        return collect(range(0, 13))->map(function (int $offset) use ($counts, $start): array {
            $day = $start->copy()->addDays($offset);

            return ['label' => $day->format('M j'), 'value' => (int) ($counts[$day->format('Y-m-d')] ?? 0)];
        })->all();
    }

    private function datePeriodExpression(string $column, string $format): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return "strftime('{$format}', {$column})";
        }

        return "DATE_FORMAT({$column}, '{$format}')";
    }
}
