<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalLessons = (int) ($this->course->published_lessons_count ?? 0);
        $completedLessons = (int) ($this->completed_lessons_count ?? 0);

        return [
            'id' => $this->id,
            'status' => $this->status,
            'completion_percentage' => $totalLessons > 0
                ? (int) round(($completedLessons / $totalLessons) * 100)
                : 0,
            'total_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'remaining_lessons' => max(0, $totalLessons - $completedLessons),
            'last_accessed_lesson_id' => $this->last_accessed_lesson_id,
            'last_accessed_lesson' => $this->whenLoaded('lastAccessedLesson', fn () => $this->lastAccessedLesson ? [
                'id' => $this->lastAccessedLesson->id,
                'title' => $this->lastAccessedLesson->title,
            ] : null),
            'course' => [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'thumbnail' => $this->course->thumbnail,
                'instructor' => [
                    'name' => $this->course->instructor->name,
                ],
                'category' => [
                    'id' => $this->course->category->id,
                    'name' => $this->course->category->name,
                ],
            ],
        ];
    }
}
