<?php

$frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');

$allowedOrigins = array_values(array_filter(array_map(
    static fn (string $origin): string => rtrim(trim($origin), '/'),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', $frontendUrl))
)));

$allowedOriginPatterns = array_values(array_filter(array_map(
    static fn (string $pattern): string => trim($pattern),
    explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', ''))
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique($allowedOrigins)),
    'allowed_origins_patterns' => $allowedOriginPatterns,
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => (int) env('CORS_MAX_AGE', 600),
    'supports_credentials' => true,
];
