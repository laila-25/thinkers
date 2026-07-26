<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateGamificationSettingsRequest;
use App\Models\LearnerProfile;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function show(Request $request, GamificationService $gamification): JsonResponse
    {
        abort_unless($request->user()->hasRole('student'), 403);

        return response()->json(['data' => $gamification->profileData($request->user())]);
    }

    public function leaderboard(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('student'), 403);
        $rows = LearnerProfile::query()
            ->join('users', 'users.id', '=', 'learner_profiles.user_id')
            ->where('learner_profiles.leaderboard_visible', true)
            ->select(['users.id', 'users.name', 'learner_profiles.total_xp'])
            ->selectSub(fn ($query) => $query->from('enrollments')->selectRaw('COUNT(*)')->whereColumn('enrollments.user_id', 'users.id')->where('status', 'completed'), 'completed_courses')
            ->selectSub(fn ($query) => $query->from('progress')->join('enrollments', 'enrollments.id', '=', 'progress.enrollment_id')->join('lessons', 'lessons.id', '=', 'progress.lesson_id')->selectRaw('COALESCE(SUM(lessons.duration), 0) / 60')->whereColumn('enrollments.user_id', 'users.id'), 'learning_hours')
            ->orderByDesc('learner_profiles.total_xp')
            ->orderByDesc('completed_courses')
            ->orderByDesc('learning_hours')
            ->limit(50)
            ->get()
            ->values()
            ->map(fn ($row, int $index) => [
                'rank' => $index + 1, 'name' => $row->name, 'xp' => (int) $row->total_xp,
                'completed_courses' => (int) $row->completed_courses, 'learning_hours' => round((float) $row->learning_hours, 1),
                'is_current_user' => (int) $row->id === (int) $request->user()->id,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function updateSettings(UpdateGamificationSettingsRequest $request, GamificationService $gamification): JsonResponse
    {
        $profile = LearnerProfile::firstOrCreate(['user_id' => $request->user()->id]);
        $profile->update($request->validated());

        return response()->json(['data' => $gamification->profileData($request->user())]);
    }
}
