<?php

namespace App\Http\Requests;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Course::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', Rule::exists('categories', 'id')->where('is_active', true)],
            'title' => ['required', 'string', 'max:255'],
            'short_description' => ['required', 'string', 'max:500'],
            'description' => ['required', 'string'],
            'thumbnail' => ['nullable', 'string', 'max:2048'],
            'level' => ['required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'language' => ['required', 'string', 'max:50'],
            'duration' => ['required', 'integer', 'min:0'],
            'type' => ['required', Rule::in(['free', 'paid'])],
            'price' => ['required_if:type,paid', 'numeric', 'min:0.01', 'max:99999999.99'],
        ];
    }
}
