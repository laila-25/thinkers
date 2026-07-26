<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createPending(User $user, Course $course): Order
    {
        if (! $user->hasRole('student')) {
            throw ValidationException::withMessages(['course_id' => 'Only students can create course orders.']);
        }

        if ($course->status !== 'published' || ! $course->published_at) {
            throw ValidationException::withMessages(['course_id' => 'Orders can only be created for published courses.']);
        }

        if ($course->type !== 'paid' || (float) $course->price <= 0) {
            throw ValidationException::withMessages(['course_id' => 'Orders can only be created for paid courses.']);
        }

        return DB::transaction(function () use ($user, $course): Order {
            $lockedCourse = Course::query()->lockForUpdate()->findOrFail($course->id);

            if (Order::query()
                ->where('user_id', $user->id)
                ->where('course_id', $lockedCourse->id)
                ->whereIn('status', [Order::STATUS_PENDING, Order::STATUS_PAID])
                ->exists()) {
                throw ValidationException::withMessages(['course_id' => 'An active order already exists for this course.']);
            }

            return Order::query()->create([
                'user_id' => $user->id,
                'course_id' => $lockedCourse->id,
                'amount' => $lockedCourse->price,
                'currency' => $lockedCourse->currency ?: 'USD',
                'status' => Order::STATUS_PENDING,
            ]);
        });
    }
}
