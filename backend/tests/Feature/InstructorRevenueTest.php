<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Models\Category;
use App\Models\Course;
use App\Models\InstructorEarning;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstructorRevenueTest extends TestCase
{
    use RefreshDatabase;

    private RevenueFakePaymentGateway $gateway;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->gateway = new RevenueFakePaymentGateway;
        $this->app->instance(PaymentGateway::class, $this->gateway);
    }

    public function test_paid_order_creates_an_instructor_earning_from_the_course_price(): void
    {
        [$student, $instructor, $course, $order] = $this->marketplaceOrder();
        $this->pay($order, 'evt_earning', 'pi_earning');

        $this->assertDatabaseHas('instructor_earnings', [
            'instructor_id' => $instructor->id,
            'order_id' => $order->id,
            'course_id' => $course->id,
            'gross_amount' => 100.00,
            'platform_fee' => 20.00,
            'instructor_amount' => 80.00,
            'currency' => 'USD',
            'status' => InstructorEarning::STATUS_PENDING,
        ]);
        $this->assertDatabaseHas('enrollments', [
            'user_id' => $student->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_duplicate_webhook_does_not_duplicate_an_instructor_earning(): void
    {
        [, , , $order] = $this->marketplaceOrder();
        $this->gateway->event = $this->successfulEvent($order, 'evt_duplicate', 'pi_duplicate');
        $headers = ['Stripe-Signature' => 'valid'];

        $this->postJson('/api/payment/webhook/stripe', ['signed' => true], $headers)->assertOk();
        $this->postJson('/api/payment/webhook/stripe', ['signed' => true], $headers)
            ->assertOk()->assertJsonPath('duplicate', true);

        $this->assertDatabaseCount('instructor_earnings', 1);
    }

    public function test_instructor_sees_only_their_own_earnings(): void
    {
        [, $instructor, , $order] = $this->marketplaceOrder();
        $this->pay($order, 'evt_owner', 'pi_owner');

        [, $otherInstructor, , $otherOrder] = $this->marketplaceOrder();
        $this->pay($otherOrder, 'evt_other', 'pi_other');

        $this->actingAs($instructor)->getJson('/api/instructor/earnings')
            ->assertOk()
            ->assertJsonPath('data.total_revenue', '80.00')
            ->assertJsonPath('data.pending_earnings', '80.00')
            ->assertJsonPath('data.available_earnings', '0.00')
            ->assertJsonPath('data.sales_count', 1)
            ->assertJsonCount(1, 'data.revenue_history.data')
            ->assertJsonMissing(['instructor_id' => $otherInstructor->id]);
    }

    public function test_student_cannot_access_instructor_earnings(): void
    {
        [$student] = $this->marketplaceOrder();

        $this->actingAs($student)->getJson('/api/instructor/earnings')->assertForbidden();
    }

    public function test_admin_can_view_aggregate_revenue(): void
    {
        [, , , $order] = $this->marketplaceOrder();
        $this->pay($order, 'evt_admin', 'pi_admin');
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $this->actingAs($admin)->getJson('/api/admin/revenue')
            ->assertOk()
            ->assertJsonPath('data.total_sales', 1)
            ->assertJsonPath('data.gross_revenue', '100.00')
            ->assertJsonPath('data.platform_revenue', '20.00')
            ->assertJsonPath('data.instructor_earnings', '80.00')
            ->assertJsonPath('data.monthly_revenue.0.total_sales', 1);
    }

    public function test_pending_order_creates_no_instructor_earning(): void
    {
        [, , , $order] = $this->marketplaceOrder();

        $this->assertSame(Order::STATUS_PENDING, $order->status);
        $this->assertDatabaseCount('instructor_earnings', 0);
    }

    private function pay(Order $order, string $eventId, string $transactionId): void
    {
        $this->gateway->event = $this->successfulEvent($order, $eventId, $transactionId);
        $this->postJson('/api/payment/webhook/stripe', ['signed' => true], [
            'Stripe-Signature' => 'valid',
        ])->assertOk();
    }

    /** @return array<string, mixed> */
    private function successfulEvent(Order $order, string $eventId, string $transactionId): array
    {
        return [
            'id' => $eventId,
            'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id' => 'cs_'.$eventId,
                'metadata' => ['order_id' => (string) $order->id],
                'payment_status' => 'paid',
                'payment_intent' => $transactionId,
                'amount_total' => 10000,
                'currency' => 'usd',
            ]],
        ];
    }

    private function marketplaceOrder(): array
    {
        $student = $this->student();
        $instructor = User::factory()->create([
            'email_verified_at' => now(),
            'instructor_status' => 'approved',
        ]);
        $instructor->assignRole('instructor');
        $category = Category::create([
            'name' => fake()->unique()->word(),
            'slug' => fake()->unique()->slug(),
        ]);
        $course = Course::create([
            'instructor_id' => $instructor->id,
            'category_id' => $category->id,
            'title' => 'Marketplace Course',
            'slug' => fake()->unique()->slug(),
            'short_description' => 'A paid marketplace course.',
            'description' => 'Marketplace revenue course.',
            'level' => 'beginner',
            'language' => 'English',
            'duration' => 60,
            'price' => 100,
            'currency' => 'USD',
            'type' => 'paid',
            'status' => 'published',
            'published_at' => now(),
        ]);
        $order = Order::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'amount' => 100,
            'currency' => 'USD',
            'status' => Order::STATUS_PENDING,
        ]);

        return [$student, $instructor, $course, $order];
    }

    private function student(): User
    {
        $student = User::factory()->create(['email_verified_at' => now()]);
        $student->assignRole('student');

        return $student;
    }
}

class RevenueFakePaymentGateway implements PaymentGateway
{
    /** @var array<string, mixed> */
    public array $event = [];

    public function createCheckoutSession(Order $order): array
    {
        return ['id' => 'cs_revenue', 'url' => 'https://checkout.stripe.test/revenue'];
    }

    public function verifyWebhook(string $payload, string $signature): array
    {
        return $this->event;
    }
}
