<?php

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Gateways\StripeGateway;
use App\Models\AIMessage;
use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Observers\AnalyticsCacheObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, StripeGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('ai-generation', function ($request): array {
            $key = 'user:'.($request->user()?->getAuthIdentifier() ?: $request->ip());

            return [
                Limit::perMinute(6)->by($key),
                Limit::perDay(100)->by($key),
            ];
        });

        Queue::failing(function (JobFailed $event): void {
            Log::error('Queue job failed.', [
                'connection' => $event->connectionName,
                'queue' => $event->job->getQueue(),
                'job' => $event->job->resolveName(),
                'exception' => $event->exception::class,
            ]);
        });

        User::observe(AnalyticsCacheObserver::class);
        Course::observe(AnalyticsCacheObserver::class);
        Enrollment::observe(AnalyticsCacheObserver::class);
        Category::observe(AnalyticsCacheObserver::class);
        AIMessage::observe(AnalyticsCacheObserver::class);

        VerifyEmail::createUrlUsing(function (User $user): string {
            $verificationPath = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes((int) config('auth.verification.expire', 60)),
                [
                    'id' => $user->getKey(),
                    'hash' => sha1($user->getEmailForVerification()),
                ],
                absolute: false,
            );

            return rtrim((string) config('app.frontend_url'), '/').'/verify-email?'.http_build_query([
                'verification' => $verificationPath,
            ]);
        });

        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            return rtrim((string) config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });
    }
}
