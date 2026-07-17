<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Http\Resources\LessonContentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorCurriculumController extends Controller
{
    public function show(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin') || ($request->user()->hasRole('instructor') && $course->instructor_id === $request->user()->id), 403);
        $course->load(['sections.lessons.video', 'sections.lessons.attachments']);

        return response()->json(['data' => [
            'id' => $course->id,
            'title' => $course->title,
            'status' => $course->status,
            'sections' => $course->sections->map(fn ($section) => [
                'id' => $section->id,
                'title' => $section->title,
                'description' => $section->description,
                'position' => $section->position,
                'lessons' => LessonContentResource::collection($section->lessons)->resolve($request),
            ]),
        ]]);
    }
}
