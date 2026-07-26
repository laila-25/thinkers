<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\User;
use App\Notifications\PlatformNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EnrollmentService
{
    public function __construct(private readonly GamificationService $gamification) {}

    public function enroll(User $user, Course $course): Enrollment
    {
        if (! $user->hasRole('student')) {
            throw ValidationException::withMessages(['course' => 'Only students can enroll in courses.']);
        }
        if ($course->status !== 'published' || ! $course->published_at) {
            throw ValidationException::withMessages(['course' => 'Only published courses are available for enrollment.']);
        }
        if (! in_array($course->type, ['free', 'paid'], true)) {
            throw ValidationException::withMessages(['course' => 'This course is not available for enrollment.']);
        }
        if (Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages(['course' => 'You are already enrolled in this course.']);
        }

        return DB::transaction(function () use ($user, $course): Enrollment {
            if ($course->type === 'paid') {
                $paidOrder = Order::query()
                    ->where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->where('status', Order::STATUS_PAID)
                    ->lockForUpdate()
                    ->first();

                if (! $paidOrder) {
                    throw ValidationException::withMessages([
                        'course' => 'A paid order is required before enrolling in this course.',
                    ]);
                }
            }

            $enrollment = Enrollment::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'status' => 'active',
                'enrolled_at' => now(),
            ]);
            $this->gamification->recordEnrollment($user);
            if ($course->instructor->allowsNotification('course_updates')) {
                $course->instructor->notify(new PlatformNotification(
                    'new_enrollment', 'New enrollment', "{$user->name} enrolled in {$course->title}.",
                    '/instructor/dashboard', 'View students', 'student',
                ));
            }

            return $enrollment;
        });
    }

    public function cancel(Enrollment $enrollment): Enrollment
    {
        if ($enrollment->status !== 'active') {
            throw ValidationException::withMessages(['enrollment' => 'Only active enrollments can be cancelled.']);
        }

        $enrollment->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return $enrollment;
    }
}
