<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminAnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function overview(Request $request, AdminAnalyticsService $analytics): JsonResponse
    {
        abort_unless($request->user()->can('reports.view'), 403);

        return response()->json(['data' => $analytics->dashboard()]);
    }

    public function aiUsage(Request $request, AdminAnalyticsService $analytics): JsonResponse
    {
        abort_unless($request->user()->can('reports.view'), 403);

        return response()->json(['data' => $analytics->aiUsage()]);
    }
}
