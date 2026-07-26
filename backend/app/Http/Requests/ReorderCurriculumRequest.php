<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderCurriculumRequest extends FormRequest
{
    public function authorize(): bool
    {
        $course = $this->route('course') ?? $this->route('section')?->course;

        return $course ? ($this->user()?->can('update', $course) ?? false) : false;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['required', 'integer', 'distinct'],
        ];
    }
}
