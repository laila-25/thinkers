<?php

namespace App\Policies;

use App\Models\Certificate;
use App\Models\User;

class CertificatePolicy
{
    public function view(User $user, Certificate $certificate): bool
    {
        return $user->hasRole('admin') || ($user->hasRole('student') && $certificate->user_id === $user->id);
    }

    public function download(User $user, Certificate $certificate): bool
    {
        return $this->view($user, $certificate);
    }

    public function revoke(User $user, Certificate $certificate): bool
    {
        return $user->hasRole('admin') && $certificate->status === 'issued';
    }
}
