<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGamificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('student') ?? false;
    }

    public function rules(): array
    {
        return [
            'timezone' => ['sometimes', 'required', 'timezone:all'],
            'leaderboard_visible' => ['sometimes', 'boolean'],
        ];
    }
}
