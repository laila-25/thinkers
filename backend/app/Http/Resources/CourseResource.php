<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'thumbnail' => $this->thumbnail,
            'level' => $this->level,
            'language' => $this->language,
            'duration' => $this->duration,
            'price' => $this->price,
            'currency' => $this->currency,
            'type' => $this->type,
            'status' => $this->status,
            'average_rating' => round((float) ($this->average_rating ?? 0), 2),
            'review_count' => (int) ($this->review_count ?? 0),
            'rejection_reason' => $this->when($request->user()?->can('update', $this->resource) ?? false, $this->rejection_reason),
            'published_at' => $this->published_at,
            'instructor' => $this->whenLoaded('instructor', fn () => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
            ]),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
