<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function create(User $user): bool
    {
        return $user->isApprovedInstructor();
    }

    public function update(User $user, Course $course): bool
    {
        return $user->isApprovedInstructor()
            && $course->instructor_id === $user->id
            && in_array($course->status, ['draft', 'rejected'], true);
    }

    public function delete(User $user, Course $course): bool
    {
        return $this->update($user, $course);
    }

    public function submit(User $user, Course $course): bool
    {
        return $this->update($user, $course);
    }
}
