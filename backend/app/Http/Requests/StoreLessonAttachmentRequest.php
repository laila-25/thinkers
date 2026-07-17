<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLessonAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageContent', $this->route('lesson')) ?? false;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:51200', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt'],
            'display_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
