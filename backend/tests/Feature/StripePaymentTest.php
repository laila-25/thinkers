<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Models\Category;
use App\Models\Course;
use App\Models\Order;
use App\Models\PaymentEvent;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StripePaymentTest extends TestCase
{
    use RefreshDatabase;

    private FakePaymentGateway $gateway;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->gateway = new FakePaymentGateway;
        $this->app->instance(PaymentGateway::class, $this->gateway);
    }

    public function test_owner_can_create_a_checkout_session_for_a_pending_order(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $order = $this->order($student, $course);

        $this->actingAs($student)->postJson("/api/orders/{$order->id}/payment")
            ->assertCreated()
            ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.test/session')
            ->assertJsonPath('data.session_id', 'cs_test_123');

        $this->assertSame($order->id, $this->gateway->checkoutOrder?->id);
        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->status);
    }

    public function test_user_cannot_pay_another_users_order(): void
    {
        [$owner, $course] = $this->studentAndCourse();
        $order = $this->order($owner, $course);
        $other = $this->student();

        $this->actingAs($other)->postJson("/api/orders/{$order->id}/payment")
            ->assertForbidden();

        $this->assertNull($this->gateway->checkoutOrder);
    }

    public function test_successful_webhook_marks_order_paid_and_enrolls_student(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $order = $this->order($student, $course);
        $this->gateway->event = $this->event('evt_success', 'checkout.session.completed', $order, [
            'payment_status' => 'paid',
            'payment_intent' => 'pi_success',
        ]);

        $this->postJson('/api/payment/webhook/stripe', ['event' => 'signed'], [
            'Stripe-Signature' => 'valid',
        ])->assertOk()->assertJsonPath('processed', true);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => Order::STATUS_PAID,
            'payment_method' => 'stripe',
            'transaction_id' => 'pi_success',
        ]);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_failed_webhook_marks_order_failed_without_enrolling_student(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $order = $this->order($student, $course);
        $this->gateway->event = $this->event('evt_failed', 'payment_intent.payment_failed', $order);

        $this->postJson('/api/payment/webhook/stripe', ['event' => 'signed'], [
            'Stripe-Signature' => 'valid',
        ])->assertOk();

        $this->assertSame(Order::STATUS_FAILED, $order->fresh()->status);
        $this->assertDatabaseMissing('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_duplicate_webhook_does_not_duplicate_enrollment(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $order = $this->order($student, $course);
        $this->gateway->event = $this->event('evt_replayed', 'checkout.session.completed', $order, [
            'payment_status' => 'paid',
            'payment_intent' => 'pi_replayed',
        ]);

        $headers = ['Stripe-Signature' => 'valid'];
        $this->postJson('/api/payment/webhook/stripe', ['event' => 'signed'], $headers)
            ->assertOk()->assertJsonPath('duplicate', false);
        $this->postJson('/api/payment/webhook/stripe', ['event' => 'signed'], $headers)
            ->assertOk()->assertJsonPath('duplicate', true);

        $this->assertSame(1, PaymentEvent::query()->where('event_id', 'evt_replayed')->count());
        $this->assertDatabaseCount('enrollments', 1);
    }

    /** @return array<string, mixed> */
    private function event(string $id, string $type, Order $order, array $extra = []): array
    {
        return [
            'id' => $id,
            'type' => $type,
            'data' => ['object' => array_merge([
                'id' => 'cs_object',
                'metadata' => ['order_id' => (string) $order->id],
                'amount_total' => 4999,
                'amount_received' => 4999,
                'currency' => 'usd',
            ], $extra)],
        ];
    }

    private function studentAndCourse(): array
    {
        $student = $this->student();
        $instructor = User::factory()->create([
            'email_verified_at' => now(),
            'instructor_status' => 'approved',
        ]);
        $instructor->assignRole('instructor');
        $category = Category::create(['name' => fake()->unique()->word(), 'slug' => fake()->unique()->slug()]);
        $course = Course::create([
            'instructor_id' => $instructor->id,
            'category_id' => $category->id,
            'title' => 'Stripe Course',
            'slug' => fake()->unique()->slug(),
            'short_description' => 'A paid course.',
            'description' => 'Stripe checkout course.',
            'level' => 'beginner',
            'language' => 'English',
            'duration' => 60,
            'price' => 49.99,
            'currency' => 'USD',
            'type' => 'paid',
            'status' => 'published',
            'published_at' => now(),
        ]);

        return [$student, $course];
    }

    private function student(): User
    {
        $student = User::factory()->create(['email_verified_at' => now()]);
        $student->assignRole('student');

        return $student;
    }

    private function order(User $student, Course $course): Order
    {
        return Order::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'amount' => $course->price,
            'currency' => $course->currency,
            'status' => Order::STATUS_PENDING,
        ]);
    }
}

class FakePaymentGateway implements PaymentGateway
{
    public ?Order $checkoutOrder = null;

    /** @var array<string, mixed> */
    public array $event = [];

    public function createCheckoutSession(Order $order): array
    {
        $this->checkoutOrder = $order;

        return ['id' => 'cs_test_123', 'url' => 'https://checkout.stripe.test/session'];
    }

    public function verifyWebhook(string $payload, string $signature): array
    {
        return $this->event;
    }
}
