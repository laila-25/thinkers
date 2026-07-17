<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;

class EnrollmentPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function view(User $user, Enrollment $enrollment): bool
    {
        return $user->hasRole('student') && $enrollment->user_id === $user->id;
    }

    public function updateProgress(User $user, Enrollment $enrollment): bool
    {
        return $this->view($user, $enrollment) && $enrollment->status === 'active';
    }

    public function cancel(User $user, Enrollment $enrollment): bool
    {
        return $this->view($user, $enrollment) && $enrollment->status === 'active';
    }
}
