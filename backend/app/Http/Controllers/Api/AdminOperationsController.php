<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOperationsController extends Controller
{
    public function activity(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('reports.view'), 403);
        $logs = ActivityLog::query()
            ->with('actor:id,name')
            ->latest()
            ->paginate(min(max($request->integer('per_page', 20), 5), 100));

        return response()->json([
            'data' => $logs->map(fn (ActivityLog $log): array => [
                'id' => $log->id,
                'action' => $log->action,
                'actor' => $log->actor ? ['id' => $log->actor->id, 'name' => $log->actor->name] : null,
                'subject_type' => class_basename((string) $log->subject_type),
                'subject_id' => $log->subject_id,
                'metadata' => $log->metadata,
                'created_at' => $log->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('reports.view'), 403);
        $pendingInstructors = User::where('instructor_status', 'pending')->count();
        $pendingCourses = Course::where('status', 'pending_review')->count();
        $failedOrders = Order::where('status', Order::STATUS_FAILED)->count();

        return response()->json(['data' => array_values(array_filter([
            $pendingInstructors ? ['type' => 'instructor', 'count' => $pendingInstructors, 'route' => '/admin/instructors'] : null,
            $pendingCourses ? ['type' => 'course', 'count' => $pendingCourses, 'route' => '/admin/courses'] : null,
            $failedOrders ? ['type' => 'order', 'count' => $failedOrders, 'route' => '/admin/orders'] : null,
        ]))]);
    }
}
