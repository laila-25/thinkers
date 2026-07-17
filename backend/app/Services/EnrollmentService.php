<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EnrollmentService
{
    public function enroll(User $user, Course $course): Enrollment
    {
        if (! $user->hasRole('student')) {
            throw ValidationException::withMessages(['course' => 'Only students can enroll in courses.']);
        }
        if ($course->status !== 'published' || ! $course->published_at) {
            throw ValidationException::withMessages(['course' => 'Only published courses are available for enrollment.']);
        }
        if ($course->type !== 'free') {
            throw ValidationException::withMessages(['course' => 'Paid course enrollment will be available after payment support is implemented.']);
        }
        if (Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages(['course' => 'You are already enrolled in this course.']);
        }

        return DB::transaction(fn () => Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]));
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
