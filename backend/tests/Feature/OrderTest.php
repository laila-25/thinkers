<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_student_can_create_a_pending_order_for_a_paid_course_using_the_database_price(): void
    {
        [$student, $course] = $this->studentAndCourse();

        $this->actingAs($student)->getJson("/api/checkout/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $course->id)
            ->assertJsonPath('data.price', '49.99');

        $this->actingAs($student)->postJson('/api/orders', ['course_id' => $course->id])
            ->assertCreated()
            ->assertJsonPath('data.status', Order::STATUS_PENDING)
            ->assertJsonPath('data.amount', '49.99')
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.course.id', $course->id);

        $this->assertDatabaseHas('orders', [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'amount' => 49.99,
            'status' => Order::STATUS_PENDING,
            'transaction_id' => null,
        ]);
    }

    public function test_student_cannot_create_an_order_for_a_free_course(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $course->update(['type' => 'free', 'price' => 0]);

        $this->actingAs($student)->postJson('/api/orders', ['course_id' => $course->id])
            ->assertUnprocessable();

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_student_cannot_access_another_students_order(): void
    {
        [$owner, $course] = $this->studentAndCourse();
        $other = $this->student();
        $order = $this->order($owner, $course, Order::STATUS_PENDING);

        $this->actingAs($other)->getJson("/api/orders/{$order->id}")->assertForbidden();
        $this->actingAs($other)->getJson('/api/orders')
            ->assertOk()
            ->assertJsonMissing(['id' => $order->id]);
    }

    public function test_student_cannot_set_payment_control_fields(): void
    {
        [$student, $course] = $this->studentAndCourse();

        $this->actingAs($student)->postJson('/api/orders', [
            'course_id' => $course->id,
            'amount' => 0.01,
            'currency' => 'EUR',
            'status' => Order::STATUS_PAID,
            'payment_method' => 'manual',
            'transaction_id' => 'student-controlled',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['amount', 'currency', 'status', 'payment_method', 'transaction_id']);

        $this->assertDatabaseCount('orders', 0);

        $order = $this->order($student, $course, Order::STATUS_PENDING);
        $this->actingAs($student)->patchJson("/api/orders/{$order->id}", [
            'status' => Order::STATUS_PAID,
        ])->assertStatus(405);
        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->status);
    }

    public function test_paid_order_allows_paid_course_enrollment(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $this->order($student, $course, Order::STATUS_PAID);

        $this->actingAs($student)->postJson("/api/courses/{$course->id}/enroll")
            ->assertCreated()
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('enrollments', ['user_id' => $student->id, 'course_id' => $course->id]);
        $enrollmentId = $student->enrollments()->where('course_id', $course->id)->value('id');
        $this->actingAs($student)->getJson("/api/orders?course_id={$course->id}")
            ->assertOk()
            ->assertJsonPath('data.0.enrollment_id', $enrollmentId);
    }

    public function test_non_paid_orders_block_paid_course_enrollment(): void
    {
        foreach ([Order::STATUS_PENDING, Order::STATUS_FAILED, Order::STATUS_REFUNDED] as $status) {
            [$student, $course] = $this->studentAndCourse();
            $this->order($student, $course, $status);

            $this->actingAs($student)->postJson("/api/courses/{$course->id}/enroll")
                ->assertUnprocessable();
        }

        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_admin_can_view_all_orders(): void
    {
        [$student, $course] = $this->studentAndCourse();
        $order = $this->order($student, $course, Order::STATUS_PAID);
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $this->actingAs($admin)->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $order->id);
        $this->actingAs($admin)->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id);
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
            'title' => 'Secure Paid Course',
            'slug' => fake()->unique()->slug(),
            'short_description' => 'A paid course.',
            'description' => 'A secure paid course.',
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

    private function order(User $student, Course $course, string $status): Order
    {
        return Order::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'amount' => $course->price,
            'currency' => $course->currency,
            'status' => $status,
            'transaction_id' => $status === Order::STATUS_PAID ? fake()->uuid() : null,
        ]);
    }
}
