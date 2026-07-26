<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function create(User $user, Course $course): bool
    {
        return $user->hasRole('student') && $course->status === 'published';
    }

    public function update(User $user, Review $review): bool
    {
        return $user->hasRole('student') && $review->user_id === $user->id;
    }

    public function delete(User $user, Review $review): bool
    {
        return $this->update($user, $review);
    }

    public function viewCourse(User $user, Course $course): bool
    {
        return $user->isApprovedInstructor() && $course->instructor_id === $user->id;
    }
}
