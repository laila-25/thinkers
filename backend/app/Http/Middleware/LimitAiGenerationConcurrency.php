<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class LimitAiGenerationConcurrency
{
    public function handle(Request $request, Closure $next): Response
    {
        $identity = hash('sha256', (string) ($request->user()?->getAuthIdentifier() ?: $request->ip()));
        $lock = Cache::lock("ai:generation:{$identity}", 95);

        if (! $lock->get()) {
            return new JsonResponse(['message' => 'An AI generation request is already in progress.'], 429);
        }

        try {
            return $next($request);
        } finally {
            $lock->release();
        }
    }
}
