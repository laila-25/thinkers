<?php

namespace App\Http\Resources;

use App\Services\HtmlSanitizer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => app(HtmlSanitizer::class)->sanitize((string) $this->description),
            'learning_objectives' => $this->learning_objectives ?? [],
            'requirements' => $this->requirements ?? [],
            'target_audience' => $this->target_audience ?? [],
            'thumbnail' => $this->thumbnail,
            'has_promotional_video' => filled($this->promotional_video_path),
            'promotional_video_url' => $this->when(
                filled($this->promotional_video_path) && ($request->user()?->hasRole('admin') || $request->user()?->id === $this->instructor_id),
                fn () => route('courses.promotional-video', $this->resource),
            ),
            'level' => $this->level,
            'language' => $this->language,
            'duration' => $this->duration,
            'price' => $this->price,
            'currency' => $this->currency,
            'type' => $this->type,
            'status' => $this->status,
            'average_rating' => round((float) ($this->average_rating ?? 0), 2),
            'review_count' => (int) ($this->review_count ?? 0),
            'enrollments_count' => $this->when(isset($this->enrollments_count), (int) $this->enrollments_count),
            'rejection_reason' => $this->when($request->user()?->can('update', $this->resource) ?? false, $this->rejection_reason),
            'published_at' => $this->published_at,
            'instructor' => $this->whenLoaded('instructor', fn () => [
                'id' => $this->instructor->id,
                'name' => $this->instructor->name,
                'email' => $this->when($request->user()?->hasRole('admin') ?? false, $this->instructor->email),
            ]),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
