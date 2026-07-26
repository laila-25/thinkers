<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCourseBuilderRequest;
use App\Http\Resources\CourseResource;
use App\Http\Resources\LessonContentResource;
use App\Models\Course;
use App\Services\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class CourseBuilderController extends Controller
{
    public function show(Course $course): JsonResponse
    {
        Gate::authorize('update', $course);

        return response()->json(['data' => $this->payload($course)]);
    }

    public function update(UpdateCourseBuilderRequest $request, Course $course, HtmlSanitizer $sanitizer): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['description'])) {
            $data['description'] = $sanitizer->sanitize($data['description']);
        }
        if (isset($data['title']) && $data['title'] !== $course->title) {
            $data['slug'] = $this->uniqueSlug($data['title'], $course->id);
        }
        if (($data['type'] ?? $course->type) === 'free') {
            $data['price'] = 0;
        }
        $course->update($data);

        return response()->json(['data' => $this->payload($course->fresh())]);
    }

    public function preview(Course $course): JsonResponse
    {
        $allowed = request()->user()->hasRole('admin')
            || (request()->user()->isApprovedInstructor() && $course->instructor_id === request()->user()->id);
        abort_unless($allowed, 403);

        return response()->json(['data' => $this->payload($course)]);
    }

    private function payload(Course $course): array
    {
        $course->load(['instructor:id,name', 'category', 'sections.lessons.video', 'sections.lessons.attachments']);

        return [
            'course' => (new CourseResource($course))->resolve(request()),
            'sections' => $course->sections->map(fn ($section) => [
                'id' => $section->id,
                'title' => $section->title,
                'description' => $section->description,
                'position' => $section->position,
                'lessons' => LessonContentResource::collection($section->lessons)->resolve(request()),
            ]),
        ];
    }

    private function uniqueSlug(string $title, int $ignoreId): string
    {
        $base = Str::slug($title) ?: 'course';
        $slug = $base;
        $counter = 2;
        while (Course::where('slug', $slug)->whereKeyNot($ignoreId)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
