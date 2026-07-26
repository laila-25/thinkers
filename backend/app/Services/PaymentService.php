<?php

namespace App\Services;

use App\Contracts\PaymentGateway;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\PaymentEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly EnrollmentService $enrollments,
        private readonly InstructorRevenueService $revenue,
    ) {}

    /** @return array{id: string, url: string} */
    public function start(Order $order): array
    {
        if ($order->status !== Order::STATUS_PENDING) {
            throw ValidationException::withMessages(['order' => 'Only pending orders can be paid.']);
        }

        return $this->gateway->createCheckoutSession($order);
    }

    /** @return array{duplicate: bool, processed: bool} */
    public function handleWebhook(string $payload, string $signature): array
    {
        $event = $this->gateway->verifyWebhook($payload, $signature);

        return DB::transaction(function () use ($event, $payload): array {
            $eventId = (string) data_get($event, 'id', '');
            $type = (string) data_get($event, 'type', '');
            if ($eventId === '' || $type === '') {
                throw ValidationException::withMessages(['webhook' => 'Malformed payment event.']);
            }

            $inserted = PaymentEvent::query()->insertOrIgnore([
                'provider' => 'stripe',
                'event_id' => $eventId,
                'type' => $type,
                'status' => PaymentEvent::STATUS_PROCESSING,
                'payload_hash' => hash('sha256', $payload),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if ($inserted === 0) {
                return ['duplicate' => true, 'processed' => false];
            }

            $paymentEvent = PaymentEvent::query()
                ->where('provider', 'stripe')->where('event_id', $eventId)->firstOrFail();
            $object = (array) data_get($event, 'data.object', []);
            $orderId = (int) data_get($object, 'metadata.order_id', data_get($object, 'client_reference_id', 0));
            $order = $orderId > 0
                ? Order::query()->with('course')->lockForUpdate()->find($orderId)
                : null;
            $paymentEvent->order_id = $order?->id;

            if (! $order || ! $this->isSupported($type)) {
                $this->finish($paymentEvent, PaymentEvent::STATUS_IGNORED);

                return ['duplicate' => false, 'processed' => false];
            }

            if ($this->isSuccess($type, $object)) {
                $this->validatePayment($order, $object);
                $transactionId = (string) (data_get($object, 'payment_intent') ?: data_get($object, 'id'));
                if ($order->status !== Order::STATUS_PAID) {
                    $order->update([
                        'status' => Order::STATUS_PAID,
                        'payment_method' => 'stripe',
                        'transaction_id' => $transactionId,
                    ]);
                }

                $this->revenue->createForPaidOrder($order);

                if (! Enrollment::query()
                    ->where('user_id', $order->user_id)->where('course_id', $order->course_id)->exists()) {
                    $this->enrollments->enroll($order->user()->firstOrFail(), $order->course);
                }
            } elseif ($this->isFailure($type) && $order->status === Order::STATUS_PENDING) {
                $order->update(['status' => Order::STATUS_FAILED, 'payment_method' => 'stripe']);
            }

            $this->finish($paymentEvent, PaymentEvent::STATUS_PROCESSED);

            return ['duplicate' => false, 'processed' => true];
        });
    }

    /** @param array<string, mixed> $object */
    private function validatePayment(Order $order, array $object): void
    {
        $amount = data_get($object, 'amount_total', data_get($object, 'amount_received'));
        $currency = strtolower((string) data_get($object, 'currency', ''));
        if ((int) $amount !== (int) round(((float) $order->amount) * 100)
            || $currency !== strtolower($order->currency)) {
            throw ValidationException::withMessages(['webhook' => 'Payment details do not match the order.']);
        }
    }

    /** @param array<string, mixed> $object */
    private function isSuccess(string $type, array $object): bool
    {
        return $type === 'checkout.session.async_payment_succeeded'
            || ($type === 'checkout.session.completed' && data_get($object, 'payment_status') === 'paid');
    }

    private function isFailure(string $type): bool
    {
        return in_array($type, ['checkout.session.async_payment_failed', 'payment_intent.payment_failed'], true);
    }

    private function isSupported(string $type): bool
    {
        return in_array($type, [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'checkout.session.async_payment_failed',
            'payment_intent.payment_failed',
        ], true);
    }

    private function finish(PaymentEvent $event, string $status): void
    {
        $event->status = $status;
        $event->processed_at = now();
        $event->save();
    }
}
