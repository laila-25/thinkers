<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('categories.manage') ?? false;
    }

    public function rules(): array
    {
        $category = $this->route('category');

        return [
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id'),
                Rule::notIn(array_filter([$category?->id])),
            ],
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($category)],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            $category = $this->route('category');
            $parentId = $this->integer('parent_id') ?: null;

            if ($category && $parentId && Category::find($parentId)?->parent_id === $category->id) {
                $validator->errors()->add('parent_id', 'A direct child cannot become its parent.');
            }
        }];
    }
}
