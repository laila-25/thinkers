<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\LessonContentResource;
use App\Models\Enrollment;
use App\Models\Lesson;
use Illuminate\Support\Facades\Gate;

class CoursePlayerController extends Controller
{
    public function enrollment(Enrollment $enrollment): EnrollmentResource
    {
        Gate::authorize('view', $enrollment);
        abort_unless(in_array($enrollment->status, ['active', 'completed'], true), 403, 'This enrollment no longer grants course access.');
        return new EnrollmentResource($enrollment->load(['course.instructor:id,name', 'course.category', 'course.sections.lessons', 'progress', 'lastAccessedLesson']));
    }

    public function lesson(Lesson $lesson): LessonContentResource
    {
        Gate::authorize('view', $lesson);
        abort_unless($lesson->is_published || auth()->user()?->hasAnyRole(['instructor', 'admin']), 404);
        return new LessonContentResource($lesson->load(['video', 'attachments', 'quiz']));
    }
}
