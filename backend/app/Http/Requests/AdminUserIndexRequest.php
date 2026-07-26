<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUserIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(['student', 'instructor', 'admin'])],
            'verification' => ['nullable', Rule::in(['verified', 'unverified'])],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ];
    }
}
