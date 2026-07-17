<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderQuestionsRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->can('manage', $this->route('quiz')) ?? false; }
    public function rules(): array { return ['question_ids' => ['required', 'array', 'min:1'], 'question_ids.*' => ['required', 'integer', 'distinct']]; }
}
