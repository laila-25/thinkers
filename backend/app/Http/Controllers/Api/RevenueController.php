<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InstructorEarning;
use App\Services\RevenueReportingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RevenueController extends Controller
{
    public function instructor(Request $request, RevenueReportingService $reporting): JsonResponse
    {
        Gate::authorize('viewAny', InstructorEarning::class);
        abort_unless($request->user()->isApprovedInstructor(), 403);

        return response()->json(['data' => $reporting->instructor($request->user())]);
    }

    public function admin(Request $request, RevenueReportingService $reporting): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin') && $request->user()->can('reports.view'), 403);

        return response()->json(['data' => $reporting->admin()]);
    }
}
