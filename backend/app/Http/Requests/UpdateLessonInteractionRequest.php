<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonInteractionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateInteraction', $this->route('enrollment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'is_bookmarked' => ['sometimes', 'boolean'],
            'is_important' => ['sometimes', 'boolean'],
        ];
    }
}
