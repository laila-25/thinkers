<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $progressByLesson = $this->progress->keyBy('lesson_id');
        $sections = $this->course->sections->map(function ($section) use ($progressByLesson): array {
            return [
                'id' => $section->id,
                'title' => $section->title,
                'description' => $section->description,
                'position' => $section->position,
                'lessons' => LessonResource::collection($section->lessons->where('is_published', true)->map(function ($lesson) use ($progressByLesson) {
                    $progress = $progressByLesson->get($lesson->id);
                    $lesson->student_progress = $progress ? [
                        'status' => $progress->status,
                        'completion_percentage' => $progress->completion_percentage,
                        'playback_position' => $progress->playback_position,
                        'last_accessed_at' => $progress->last_accessed_at,
                        'completed_at' => $progress->completed_at,
                        'notes' => $progress->notes,
                        'is_bookmarked' => $progress->is_bookmarked,
                        'is_important' => $progress->is_important,
                    ] : null;

                    return $lesson;
                })),
            ];
        });

        return [
            'id' => $this->id,
            'status' => $this->status,
            'completion_percentage' => $this->completionPercentage(),
            'enrolled_at' => $this->enrolled_at,
            'completed_at' => $this->completed_at,
            'cancelled_at' => $this->cancelled_at,
            'last_accessed_lesson_id' => $this->last_accessed_lesson_id,
            'course' => new CourseResource($this->course),
            'sections' => $sections,
        ];
    }
}
