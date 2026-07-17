<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Progress;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProgressService
{
    public function update(Enrollment $enrollment, Lesson $lesson, array $data): Progress
    {
        if ($lesson->section->course_id !== $enrollment->course_id || ! $lesson->is_published) {
            throw ValidationException::withMessages(['lesson' => 'This lesson is not available in the enrolled course.']);
        }

        if ($lesson->content_type === 'quiz' && $data['status'] === 'completed') {
            throw ValidationException::withMessages(['lesson' => 'Quiz lessons can only be completed by passing the assessment.']);
        }

        return $this->persist($enrollment, $lesson, $data['status'], (int) ($data['completion_percentage'] ?? 0), (int) ($data['playback_position'] ?? 0));
    }

    public function recordQuizResult(Enrollment $enrollment, Lesson $lesson, bool $passed, int $percentage): Progress
    {
        if ($lesson->content_type !== 'quiz' || $lesson->section->course_id !== $enrollment->course_id) {
            throw ValidationException::withMessages(['lesson' => 'The assessment does not belong to this enrollment.']);
        }

        $existing = $enrollment->progress()->where('lesson_id', $lesson->id)->first();
        if (! $passed && $existing?->status === 'completed') {
            $enrollment->update(['last_accessed_lesson_id' => $lesson->id]);
            return $existing;
        }

        return $this->persist($enrollment, $lesson, $passed ? 'completed' : 'in_progress', $passed ? 100 : min($percentage, 99), 0);
    }

    private function persist(Enrollment $enrollment, Lesson $lesson, string $status, int $percentage, int $playbackPosition): Progress
    {
        return DB::transaction(function () use ($enrollment, $lesson, $status, $percentage, $playbackPosition): Progress {
            $percentage = $status === 'completed' ? 100 : min($percentage, 99);
            $progress = Progress::updateOrCreate(
                ['enrollment_id' => $enrollment->id, 'lesson_id' => $lesson->id],
                [
                    'status' => $status,
                    'completion_percentage' => $percentage,
                    'playback_position' => $playbackPosition,
                    'started_at' => $status === 'not_started' ? null : now(),
                    'last_accessed_at' => now(),
                    'completed_at' => $status === 'completed' ? now() : null,
                ]
            );

            $enrollment->update(['last_accessed_lesson_id' => $lesson->id]);
            $totalLessons = Lesson::whereHas('section', fn ($query) => $query->where('course_id', $enrollment->course_id))->where('is_published', true)->count();
            $completedLessons = $enrollment->progress()->where('status', 'completed')->count();
            if ($totalLessons > 0 && $completedLessons === $totalLessons) {
                $enrollment->update(['status' => 'completed', 'completed_at' => now()]);
            }

            return $progress->load('lesson');
        });
    }
}
