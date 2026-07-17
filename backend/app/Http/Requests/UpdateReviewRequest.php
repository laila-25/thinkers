<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReviewRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->can('update', $this->route('review')) ?? false; }
    public function rules(): array { return ['rating' => ['required', 'integer', 'between:1,5'], 'review_text' => ['required', 'string', 'min:10', 'max:5000']]; }
}
