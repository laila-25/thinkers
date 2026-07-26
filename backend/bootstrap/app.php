<?php

use App\Http\Middleware\LimitAiGenerationConcurrency;
use App\Http\Middleware\LogSlowRequests;
use App\Http\Middleware\SetLocale;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_PREFIX
        );
        $middleware->statefulApi();
        $middleware->api(prepend: [SetLocale::class, LogSlowRequests::class]);
        $middleware->alias(['ai.concurrency' => LimitAiGenerationConcurrency::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (QueryException $exception) {
            if (request()->expectsJson() || request()->is('api/*')) {
                return response()->json([
                    'message' => 'The service is temporarily unavailable. Please try again shortly.',
                ], 503);
            }
        });

        $exceptions->report(function (Throwable $exception): void {
            if (! $exception instanceof HttpExceptionInterface || $exception->getStatusCode() >= 500) {
                Log::critical('Critical application exception.', [
                    'exception' => $exception::class,
                    'route' => request()->route()?->getName() ?: request()->route()?->uri(),
                ]);
            }
        });
    })->create();
