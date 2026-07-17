<?php

namespace App\Http\Requests;

use App\Models\Review;
use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->can('create', [Review::class, $this->route('course')]) ?? false; }
    public function rules(): array { return ['rating' => ['required', 'integer', 'between:1,5'], 'review_text' => ['required', 'string', 'min:10', 'max:5000']]; }
}
