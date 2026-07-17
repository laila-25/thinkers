<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateLessonProgressRequest;
use App\Http\Resources\EnrollmentResource;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Services\EnrollmentService;
use App\Services\ProgressService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class EnrollmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()->hasRole('student'), 403);
        $enrollments = $request->user()->enrollments()
            ->with($this->relations())
            ->latest('enrolled_at')
            ->paginate(12);

        return EnrollmentResource::collection($enrollments);
    }

    public function store(Request $request, Course $course, EnrollmentService $service): EnrollmentResource
    {
        $enrollment = $service->enroll($request->user(), $course);

        return new EnrollmentResource($enrollment->load($this->relations()));
    }

    public function show(Enrollment $enrollment): EnrollmentResource
    {
        Gate::authorize('view', $enrollment);

        return new EnrollmentResource($enrollment->load($this->relations()));
    }

    public function cancel(Enrollment $enrollment, EnrollmentService $service): EnrollmentResource
    {
        Gate::authorize('cancel', $enrollment);
        $service->cancel($enrollment);

        return new EnrollmentResource($enrollment->load($this->relations()));
    }

    public function updateProgress(UpdateLessonProgressRequest $request, Enrollment $enrollment, Lesson $lesson, ProgressService $service): EnrollmentResource
    {
        $service->update($enrollment, $lesson, $request->validated());

        return new EnrollmentResource($enrollment->fresh()->load($this->relations()));
    }

    private function relations(): array
    {
        return ['course.instructor:id,name', 'course.category', 'course.sections.lessons', 'progress', 'lastAccessedLesson'];
    }
}
