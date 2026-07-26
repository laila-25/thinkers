<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\LearnerProfile;
use App\Models\LearningActivity;
use App\Models\User;
use App\Models\XpTransaction;
use App\Notifications\AchievementUnlocked;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    private const LEVELS = [
        ['number' => 1, 'name' => 'Beginner', 'minimum' => 0],
        ['number' => 2, 'name' => 'Explorer', 'minimum' => 100],
        ['number' => 3, 'name' => 'Learner', 'minimum' => 300],
        ['number' => 4, 'name' => 'Expert', 'minimum' => 700],
    ];

    public function recordLessonCompletion(User $user, int $lessonId): void
    {
        $this->recordActivity($user);
        $this->award($user, "lesson:{$lessonId}", 25, 'lesson_completed');
        $this->unlock($user, 'first_lesson');
    }

    public function recordCourseCompletion(User $user, int $courseId): void
    {
        $this->award($user, "course:{$courseId}", 200, 'course_completed');
        $this->unlock($user, 'first_course');
    }

    public function recordQuizPass(User $user, int $quizId): void
    {
        $this->recordActivity($user);
        $this->award($user, "quiz:{$quizId}", 75, 'quiz_passed');
        if ($user->xpTransactions()->where('reason', 'quiz_passed')->count() >= 5) {
            $this->unlock($user, 'quiz_master');
        }
    }

    public function recordEnrollment(User $user): void
    {
        if ($user->enrollments()->count() >= 3) {
            $this->unlock($user, 'course_collector');
        }
    }

    public function recordAiUsage(User $user): void
    {
        $this->recordActivity($user);
        $this->unlock($user, 'ai_explorer');
    }

    public function recordActivity(User $user, ?CarbonImmutable $occurredAt = null): void
    {
        DB::transaction(function () use ($user, $occurredAt): void {
            LearnerProfile::firstOrCreate(['user_id' => $user->id]);
            $profile = LearnerProfile::where('user_id', $user->id)->lockForUpdate()->firstOrFail();
            $date = ($occurredAt ?? CarbonImmutable::now())->setTimezone($profile->timezone)->toDateString();
            $created = LearningActivity::query()->insertOrIgnore([
                'user_id' => $user->id,
                'activity_date' => $date,
                'events_count' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $activity = LearningActivity::query()
                ->where('user_id', $user->id)
                ->whereDate('activity_date', $date)
                ->lockForUpdate()
                ->firstOrFail();

            if ($created === 1) {
                $previous = $profile->last_activity_date?->format('Y-m-d');
                $yesterday = CarbonImmutable::parse($date, $profile->timezone)->subDay()->toDateString();
                $profile->current_streak = $previous === $yesterday ? $profile->current_streak + 1 : 1;
                $profile->longest_streak = max($profile->longest_streak, $profile->current_streak);
                $profile->last_activity_date = $date;
                $profile->save();
                $this->awardLocked($user, $profile, "daily:{$date}", 10, 'daily_activity');

                if ($profile->current_streak > 0 && $profile->current_streak % 7 === 0) {
                    $this->awardLocked($user, $profile, "streak:{$profile->current_streak}", 50, 'streak_milestone');
                }
                if ($profile->current_streak >= 7) {
                    $this->unlock($user, 'seven_day_streak');
                }
            } else {
                $activity->increment('events_count');
            }
        });
    }

    public function award(User $user, string $rewardKey, int $points, string $reason, array $metadata = []): bool
    {
        return DB::transaction(function () use ($user, $rewardKey, $points, $reason, $metadata): bool {
            LearnerProfile::firstOrCreate(['user_id' => $user->id]);
            $profile = LearnerProfile::where('user_id', $user->id)->lockForUpdate()->firstOrFail();

            return $this->awardLocked($user, $profile, $rewardKey, $points, $reason, $metadata);
        });
    }

    public function profileData(User $user): array
    {
        $profile = LearnerProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->refresh();
        $level = $this->levelFor($profile->total_xp);
        $calendarStart = CarbonImmutable::now($profile->timezone)->subDays(34)->toDateString();

        return [
            'total_xp' => $profile->total_xp,
            'level' => $level,
            'current_streak' => $profile->current_streak,
            'longest_streak' => $profile->longest_streak,
            'last_activity_date' => $profile->last_activity_date?->toDateString(),
            'timezone' => $profile->timezone,
            'leaderboard_visible' => $profile->leaderboard_visible,
            'achievements' => $user->achievements()->orderByPivot('unlocked_at', 'desc')->get()->map(fn (Achievement $achievement) => [
                'key' => $achievement->key, 'name' => $achievement->name, 'description' => $achievement->description,
                'icon' => $achievement->icon, 'unlocked_at' => $achievement->pivot->unlocked_at,
            ])->values(),
            'calendar' => $user->learningActivities()->where('activity_date', '>=', $calendarStart)->orderBy('activity_date')->pluck('activity_date')->map->toDateString()->values(),
        ];
    }

    public function levelFor(int $xp): array
    {
        $current = collect(self::LEVELS)->last(fn (array $level) => $xp >= $level['minimum']);
        $next = collect(self::LEVELS)->first(fn (array $level) => $level['minimum'] > $xp);
        $span = $next ? $next['minimum'] - $current['minimum'] : 0;
        $earned = $xp - $current['minimum'];

        return $current + [
            'next' => $next ? ['number' => $next['number'], 'name' => $next['name'], 'requirement' => $next['minimum']] : null,
            'xp_into_level' => $earned,
            'xp_to_next' => $next ? max(0, $next['minimum'] - $xp) : 0,
            'progress_percentage' => $next && $span > 0 ? (int) round(($earned / $span) * 100) : 100,
        ];
    }

    private function awardLocked(User $user, LearnerProfile $profile, string $key, int $points, string $reason, array $metadata = []): bool
    {
        $reward = XpTransaction::firstOrCreate(
            ['user_id' => $user->id, 'reward_key' => $key],
            ['points' => $points, 'reason' => $reason, 'metadata' => $metadata ?: null, 'awarded_at' => now()]
        );
        if (! $reward->wasRecentlyCreated) {
            return false;
        }
        $profile->increment('total_xp', $points);

        return true;
    }

    private function unlock(User $user, string $key): void
    {
        $achievement = Achievement::where('key', $key)->first();
        if (! $achievement) {
            return;
        }
        $inserted = DB::table('achievement_user')->insertOrIgnore([
            'achievement_id' => $achievement->id, 'user_id' => $user->id, 'unlocked_at' => now(),
        ]);
        if ($inserted) {
            $user->notify(new AchievementUnlocked($achievement));
        }
    }
}
