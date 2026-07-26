<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['student', 'admin']);
    }

    public function view(User $user, Order $order): bool
    {
        return $user->hasRole('admin')
            || ($user->hasRole('student') && $order->user_id === $user->id);
    }

    public function pay(User $user, Order $order): bool
    {
        return $user->hasRole('student')
            && $order->user_id === $user->id
            && $order->status === Order::STATUS_PENDING;
    }
}
