<?php

namespace App\Http\Requests;

use App\Models\Quiz;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuizSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $subject = $this->route('quiz') ?? $this->route('lesson');
        return $subject instanceof Quiz
            ? ($this->user()?->can('manage', $subject) ?? false)
            : ($this->user()?->can('manageContent', $subject) ?? false);
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        return [
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'passing_score_percentage' => [$required, 'integer', 'between:1,100'],
            'maximum_attempts' => [$required, 'integer', 'between:1,100'],
            'time_limit_minutes' => ['sometimes', 'nullable', 'integer', 'between:1,1440'],
            'status' => ['sometimes', Rule::in(['draft'])],
        ];
    }
}
