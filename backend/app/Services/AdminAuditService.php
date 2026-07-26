<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AdminAuditService
{
    /** @param array<string, mixed> $metadata */
    public function record(Request $request, string $action, ?Model $subject = null, array $metadata = []): void
    {
        ActivityLog::create([
            'actor_id' => $request->user()?->id,
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'metadata' => $metadata ?: null,
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
        ]);
    }
}
