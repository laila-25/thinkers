<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminCourseIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('courses.moderate') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['draft', 'pending_review', 'published', 'rejected', 'archived'])],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ];
    }
}
