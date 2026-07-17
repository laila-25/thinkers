<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageContent', $this->route('lesson')) ?? false;
    }

    public function rules(): array
    {
        return ['content' => ['required', 'string', 'max:2000000']];
    }
}
