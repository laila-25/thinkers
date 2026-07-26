<?php

namespace App\Contracts;

use App\Models\Order;

interface PaymentGateway
{
    /** @return array{id: string, url: string} */
    public function createCheckoutSession(Order $order): array;

    /** @return array<string, mixed> */
    public function verifyWebhook(string $payload, string $signature): array;
}
