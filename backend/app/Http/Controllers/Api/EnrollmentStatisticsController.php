<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentStatisticsController extends Controller
{
    public function show(Request $request, Course $course): JsonResponse
    {
        $allowed = $request->user()->hasRole('admin')
            || ($request->user()->hasRole('instructor') && $course->instructor_id === $request->user()->id);
        abort_unless($allowed, 403);

        $counts = $course->enrollments()->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'course_id' => $course->id,
            'total' => $counts->sum(),
            'active' => (int) ($counts['active'] ?? 0),
            'completed' => (int) ($counts['completed'] ?? 0),
            'cancelled' => (int) ($counts['cancelled'] ?? 0),
            'completion_rate' => $counts->sum() ? round(((int) ($counts['completed'] ?? 0) / $counts->sum()) * 100, 2) : 0,
        ]);
    }
}
