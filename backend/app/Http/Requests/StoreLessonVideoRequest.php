<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLessonVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageContent', $this->route('lesson')) ?? false;
    }

    public function rules(): array
    {
        return ['video' => ['required', 'file', 'max:524288', 'mimes:mp4,webm,mov', 'mimetypes:video/mp4,video/webm,video/quicktime']];
    }
}
