<?php

namespace App\Policies;

use App\Models\Quiz;
use App\Models\User;

class QuizPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function view(User $user, Quiz $quiz): bool
    {
        $quiz->loadMissing('lesson.section.course');
        if ($user->isApprovedInstructor()) {
            return $quiz->lesson->section->course->instructor_id === $user->id;
        }

        return $user->hasRole('student')
            && $quiz->status === 'published'
            && $quiz->lesson->is_published
            && $quiz->lesson->section->course->status === 'published'
            && $user->enrollments()->where('course_id', $quiz->lesson->section->course_id)
                ->whereIn('status', ['active', 'completed'])->exists();
    }

    public function manage(User $user, Quiz $quiz): bool
    {
        return $user->can('manageContent', $quiz->lesson);
    }
}
