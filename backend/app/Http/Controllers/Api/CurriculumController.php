<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LessonResource;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CurriculumController extends Controller
{
    public function storeSection(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('update', $course);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'position' => ['required', 'integer', 'min:1', Rule::unique('course_sections')->where('course_id', $course->id)],
        ]);
        $section = $course->sections()->create($data);

        return response()->json(['data' => $section], 201);
    }

    public function updateSection(Request $request, CourseSection $section): JsonResponse
    {
        Gate::authorize('update', $section->course);
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'position' => ['sometimes', 'required', 'integer', 'min:1', Rule::unique('course_sections')->where('course_id', $section->course_id)->ignore($section)],
        ]);
        $section->update($data);

        return response()->json(['data' => $section]);
    }

    public function destroySection(CourseSection $section): JsonResponse
    {
        Gate::authorize('update', $section->course);
        $section->delete();

        return response()->json(status: 204);
    }

    public function storeLesson(Request $request, CourseSection $section): LessonResource
    {
        Gate::authorize('update', $section->course);
        $data = $this->validateLesson($request, $section);
        $data['slug'] = $this->uniqueLessonSlug($section, $data['title']);

        return new LessonResource($section->lessons()->create($data));
    }

    public function updateLesson(Request $request, Lesson $lesson): LessonResource
    {
        Gate::authorize('update', $lesson->section->course);
        $data = $this->validateLesson($request, $lesson->section, $lesson);
        if (isset($data['title']) && $data['title'] !== $lesson->title) {
            $data['slug'] = $this->uniqueLessonSlug($lesson->section, $data['title'], $lesson->id);
        }
        $lesson->update($data);

        return new LessonResource($lesson->fresh());
    }

    public function destroyLesson(Lesson $lesson): JsonResponse
    {
        Gate::authorize('update', $lesson->section->course);
        $lesson->delete();

        return response()->json(status: 204);
    }

    private function validateLesson(Request $request, CourseSection $section, ?Lesson $lesson = null): array
    {
        $required = $lesson ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'content_type' => [$required, Rule::in(['text', 'video', 'quiz', 'resource'])],
            'duration' => [$required, 'integer', 'min:0'],
            'position' => [$required, 'integer', 'min:1', Rule::unique('lessons')->where('course_section_id', $section->id)->ignore($lesson)],
            'is_preview' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ]);
    }

    private function uniqueLessonSlug(CourseSection $section, string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'lesson';
        $slug = $base;
        $counter = 2;
        while ($section->lessons()->where('slug', $slug)->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
