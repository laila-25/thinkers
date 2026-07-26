<?php

namespace App\Policies;

use App\Models\InstructorEarning;
use App\Models\User;

class InstructorEarningPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->isApprovedInstructor();
    }

    public function view(User $user, InstructorEarning $earning): bool
    {
        return $user->hasRole('admin')
            || ($user->isApprovedInstructor() && $earning->instructor_id === $user->id);
    }
}
