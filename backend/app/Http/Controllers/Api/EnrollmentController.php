<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateLessonInteractionRequest;
use App\Http\Requests\UpdateLessonProgressRequest;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\EnrollmentSummaryResource;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Services\EnrollmentService;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class EnrollmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()->hasRole('student'), 403);
        $enrollments = $request->user()->enrollments()
            ->with($this->summaryRelations())
            ->withCount($this->completedProgressCount())
            ->latest('enrolled_at')
            ->paginate(12);

        return EnrollmentSummaryResource::collection($enrollments);
    }

    public function store(Request $request, Course $course, EnrollmentService $service): EnrollmentSummaryResource
    {
        $enrollment = $service->enroll($request->user(), $course);

        return new EnrollmentSummaryResource($this->loadSummary($enrollment));
    }

    public function show(Enrollment $enrollment): EnrollmentSummaryResource
    {
        Gate::authorize('view', $enrollment);

        return new EnrollmentSummaryResource($this->loadSummary($enrollment));
    }

    public function cancel(Enrollment $enrollment, EnrollmentService $service): EnrollmentSummaryResource
    {
        Gate::authorize('cancel', $enrollment);
        $service->cancel($enrollment);

        return new EnrollmentSummaryResource($this->loadSummary($enrollment));
    }

    public function updateProgress(UpdateLessonProgressRequest $request, Enrollment $enrollment, Lesson $lesson, ProgressService $service): EnrollmentResource
    {
        $service->update($enrollment, $lesson, $request->validated());

        return new EnrollmentResource($enrollment->fresh()->load($this->fullRelations()));
    }

    public function updateInteraction(UpdateLessonInteractionRequest $request, Enrollment $enrollment, Lesson $lesson, ProgressService $service): JsonResponse
    {
        $progress = $service->updateInteraction($enrollment, $lesson, $request->validated());

        return response()->json(['data' => [
            'lesson_id' => $progress->lesson_id,
            'notes' => $progress->notes,
            'is_bookmarked' => $progress->is_bookmarked,
            'is_important' => $progress->is_important,
            'playback_position' => $progress->playback_position,
        ]]);
    }

    private function summaryRelations(): array
    {
        return [
            'course' => fn ($query) => $query
                ->select(['id', 'instructor_id', 'category_id', 'title', 'thumbnail'])
                ->withCount(['lessons as published_lessons_count' => fn ($query) => $query->where('is_published', true)]),
            'course.instructor:id,name',
            'course.category:id,name',
            'lastAccessedLesson:id,title',
        ];
    }

    private function completedProgressCount(): array
    {
        return ['progress as completed_lessons_count' => fn ($query) => $query->where('status', 'completed')];
    }

    private function loadSummary(Enrollment $enrollment): Enrollment
    {
        return $enrollment->load($this->summaryRelations())->loadCount($this->completedProgressCount());
    }

    private function fullRelations(): array
    {
        return ['course.instructor:id,name', 'course.category', 'course.sections.lessons', 'progress', 'lastAccessedLesson'];
    }
}
