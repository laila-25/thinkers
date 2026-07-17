<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ReviewModerationResource extends ReviewResource
{
    public function toArray(Request $request): array
    {
        return parent::toArray($request) + [
            'status' => $this->status,
            'course' => $this->whenLoaded('course', fn () => ['id' => $this->course->id, 'title' => $this->course->title, 'slug' => $this->course->slug]),
        ];
    }
}
