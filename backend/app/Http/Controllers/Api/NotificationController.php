<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNotificationSettingsRequest;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:50'],
            'unread' => ['sometimes', 'boolean'],
        ]);
        $query = $request->user()->notifications()->latest('created_at')->latest('id');
        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }
        $notifications = $query->cursorPaginate($validated['per_page'] ?? 15)->withQueryString();

        return response()->json([
            'data' => NotificationResource::collection($notifications->items())->resolve($request),
            'meta' => [
                'next_cursor' => $notifications->nextCursor()?->encode(),
                'has_more' => $notifications->hasMorePages(),
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    public function read(Request $request, string $notification): JsonResponse
    {
        /** @var DatabaseNotification $owned */
        $owned = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $owned->markAsRead();

        return response()->json([
            'data' => (new NotificationResource($owned->fresh()))->resolve($request),
            'meta' => ['unread_count' => $request->user()->unreadNotifications()->count()],
        ]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['meta' => ['unread_count' => 0]]);
    }

    public function settings(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->preferences($request)]);
    }

    public function updateSettings(UpdateNotificationSettingsRequest $request): JsonResponse
    {
        $request->user()->update(['notification_preferences' => $request->validated()]);

        return response()->json(['data' => $this->preferences($request)]);
    }

    private function preferences(Request $request): array
    {
        return array_merge([
            'course_updates' => true,
            'learning_activity' => true,
            'commerce' => true,
            'platform_alerts' => true,
        ], $request->user()->notification_preferences ?? []);
    }
}
