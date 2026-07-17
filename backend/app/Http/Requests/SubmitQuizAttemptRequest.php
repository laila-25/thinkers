<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitQuizAttemptRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->can('submit', $this->route('attempt')) ?? false; }
    public function rules(): array
    {
        return [
            'answers' => ['present', 'array'],
            'answers.*.question_id' => ['required', 'integer', 'distinct'],
            'answers.*.answer_id' => ['required', 'integer'],
        ];
    }
}
