<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModerateReviewRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->hasRole('admin') ?? false; }
    public function rules(): array { return ['status' => ['required', Rule::in(['published', 'hidden', 'pending'])]]; }
}
