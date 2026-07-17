<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLessonProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateProgress', $this->route('enrollment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['in_progress', 'completed'])],
            'completion_percentage' => ['sometimes', 'integer', 'between:0,100'],
            'playback_position' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
