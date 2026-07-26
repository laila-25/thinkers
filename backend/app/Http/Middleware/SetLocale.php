<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supported = config('localization.supported', ['en', 'ar']);
        $locale = $request->getPreferredLanguage($supported) ?: config('app.locale', 'en');

        app()->setLocale(in_array($locale, $supported, true) ? $locale : config('app.fallback_locale', 'en'));

        $response = $next($request);
        $response->headers->set('Content-Language', app()->getLocale());
        $response->headers->set('Vary', 'Accept-Language', false);

        return $response;
    }
}
