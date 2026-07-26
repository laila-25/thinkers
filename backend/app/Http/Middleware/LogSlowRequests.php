<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogSlowRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);
        $response = $next($request);
        $durationMs = (int) round((hrtime(true) - $startedAt) / 1_000_000);

        if ($durationMs >= (int) config('monitoring.slow_request_threshold_ms', 1000)) {
            Log::warning('Slow HTTP request.', [
                'method' => $request->method(),
                'route' => $request->route()?->getName() ?: $request->route()?->uri(),
                'status' => $response->getStatusCode(),
                'duration_ms' => $durationMs,
            ]);
        }

        return $response;
    }
}
