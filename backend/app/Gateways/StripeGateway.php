<?php

namespace App\Gateways;

use App\Contracts\PaymentGateway;
use App\Exceptions\InvalidWebhookException;
use App\Models\Order;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeGateway implements PaymentGateway
{
    public function createCheckoutSession(Order $order): array
    {
        $secret = (string) config('stripe.secret');
        if ($secret === '') {
            throw new InvalidWebhookException('Stripe is not configured.');
        }

        $order->loadMissing('course:id,title');
        $session = (new StripeClient($secret))->checkout->sessions->create([
            'mode' => 'payment',
            'success_url' => (string) config('stripe.checkout.success_url'),
            'cancel_url' => (string) config('stripe.checkout.cancel_url'),
            'client_reference_id' => (string) $order->id,
            'metadata' => ['order_id' => (string) $order->id, 'user_id' => (string) $order->user_id],
            'payment_intent_data' => [
                'metadata' => ['order_id' => (string) $order->id, 'user_id' => (string) $order->user_id],
            ],
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($order->currency),
                    'unit_amount' => (int) round(((float) $order->amount) * 100),
                    'product_data' => ['name' => $order->course->title],
                ],
            ]],
        ], ['idempotency_key' => 'thinkers-order-'.$order->id]);

        return ['id' => $session->id, 'url' => (string) $session->url];
    }

    public function verifyWebhook(string $payload, string $signature): array
    {
        try {
            $event = Webhook::constructEvent($payload, $signature, (string) config('stripe.webhook_secret'));
        } catch (UnexpectedValueException|SignatureVerificationException $exception) {
            throw new InvalidWebhookException('Invalid Stripe webhook.', previous: $exception);
        }

        return $event->toArray();
    }
}
