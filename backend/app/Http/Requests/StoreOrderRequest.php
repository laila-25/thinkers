<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('student') ?? false;
    }

    public function rules(): array
    {
        return [
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'amount' => ['prohibited'],
            'currency' => ['prohibited'],
            'status' => ['prohibited'],
            'payment_method' => ['prohibited'],
            'transaction_id' => ['prohibited'],
        ];
    }
}
