<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseBuilderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('course')) ?? false;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', Rule::exists('categories', 'id')->where('is_active', true)],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'short_description' => ['sometimes', 'required', 'string', 'max:500'],
            'description' => ['sometimes', 'required', 'string'],
            'learning_objectives' => ['sometimes', 'array', 'max:20'],
            'learning_objectives.*' => ['required', 'string', 'max:500'],
            'requirements' => ['sometimes', 'array', 'max:20'],
            'requirements.*' => ['required', 'string', 'max:500'],
            'target_audience' => ['sometimes', 'array', 'max:20'],
            'target_audience.*' => ['required', 'string', 'max:500'],
            'level' => ['sometimes', 'required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'language' => ['sometimes', 'required', 'string', 'max:50'],
            'duration' => ['sometimes', 'required', 'integer', 'min:0'],
            'type' => ['sometimes', 'required', Rule::in(['free', 'paid'])],
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:99999999.99'],
        ];
    }
}
