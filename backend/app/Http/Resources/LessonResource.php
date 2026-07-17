<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'content_type' => $this->content_type,
            'duration' => $this->duration,
            'position' => $this->position,
            'is_preview' => $this->is_preview,
            'is_published' => $this->is_published,
            'progress' => $this->when(isset($this->student_progress), $this->student_progress),
        ];
    }
}
