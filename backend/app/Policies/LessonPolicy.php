<?php

namespace App\Policies;

use App\Models\Lesson;
use App\Models\User;

class LessonPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function view(?User $user, Lesson $lesson): bool
    {
        $lesson->loadMissing('section.course');
        if ($lesson->is_preview && $lesson->is_published && $lesson->section->course->status === 'published') {
            return true;
        }
        if (! $user) {
            return false;
        }
        if ($user->isApprovedInstructor() && $lesson->section->course->instructor_id === $user->id) {
            return true;
        }

        return $lesson->is_published && $user->hasRole('student') && $user->enrollments()
            ->where('course_id', $lesson->section->course_id)
            ->whereIn('status', ['active', 'completed'])
            ->exists();
    }

    public function manageContent(User $user, Lesson $lesson): bool
    {
        return $user->can('update', $lesson->section->course);
    }
}
