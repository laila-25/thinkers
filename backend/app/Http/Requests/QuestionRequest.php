<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class QuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quiz = $this->route('quiz') ?? $this->route('question')?->quiz;

        return $quiz ? ($this->user()?->can('manage', $quiz) ?? false) : false;
    }

    public function rules(): array
    {
        return [
            'question_text' => ['required', 'string', 'max:10000'],
            'explanation' => ['nullable', 'string', 'max:10000'],
            'question_type' => ['required', Rule::in(['multiple_choice', 'true_false'])],
            'points' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'position' => ['required', 'integer', 'min:1'],
            'options' => ['required', 'array', 'min:2', 'max:20'],
            'options.*.option_text' => ['required', 'string', 'max:5000'],
            'options.*.is_correct' => ['required', 'boolean'],
            'options.*.position' => ['required', 'integer', 'min:1', 'distinct'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $options = $this->input('options', []);
            $correct = collect($options)->where('is_correct', true)->count();
            if ($correct !== 1) {
                $validator->errors()->add('options', 'Each question must have exactly one correct answer.');
            }
            if ($this->input('question_type') === 'true_false' && count($options) !== 2) {
                $validator->errors()->add('options', 'True/false questions must have exactly two options.');
            }
        }];
    }
}
