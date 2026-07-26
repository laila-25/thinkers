<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminAccessUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.manage') ?? false;
    }

    public function rules(): array
    {
        return ['is_admin' => ['required', 'boolean']];
    }
}
