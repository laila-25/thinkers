<?php

namespace App\Policies;

use App\Models\QuizAttempt;
use App\Models\User;

class QuizAttemptPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function view(User $user, QuizAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id;
    }

    public function submit(User $user, QuizAttempt $attempt): bool
    {
        return $this->view($user, $attempt)
            && $attempt->status === 'in_progress'
            && $attempt->enrollment->status === 'active';
    }
}
