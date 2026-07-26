<?php

return [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    'checkout' => [
        'success_url' => env('STRIPE_SUCCESS_URL', rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/').'/purchases?payment=success'),
        'cancel_url' => env('STRIPE_CANCEL_URL', rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/').'/purchases?payment=cancelled'),
    ],
];
