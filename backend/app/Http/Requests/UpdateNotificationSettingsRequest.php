<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'course_updates' => ['required', 'boolean'],
            'learning_activity' => ['required', 'boolean'],
            'commerce' => ['required', 'boolean'],
            'platform_alerts' => ['required', 'boolean'],
        ];
    }
}
