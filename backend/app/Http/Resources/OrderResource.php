<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'transaction_id' => $this->transaction_id,
            'enrollment_id' => $this->getAttribute('enrollment_id'),
            'created_at' => $this->created_at?->toISOString(),
            'course' => [
                'id' => $this->course->id,
                'title' => $this->course->title,
            ],
            'user' => $this->when(
                $request->user()?->hasRole('admin') && $this->relationLoaded('user'),
                fn () => ['id' => $this->user->id, 'name' => $this->user->name, 'email' => $this->user->email],
            ),
        ];
    }
}
