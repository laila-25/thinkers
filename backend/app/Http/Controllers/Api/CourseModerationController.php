<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseModerationController extends Controller
{
    public function approve(Request $request, Course $course): CourseResource
    {
        abort_unless($request->user()->can('courses.moderate'), 403);
        abort_unless($course->status === 'pending_review', 422, 'Only pending courses can be approved.');
        abort_unless($course->instructor->instructor_status === 'approved', 422, 'The instructor must be approved first.');

        $course->update([
            'status' => 'published',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'published_at' => now(),
            'rejection_reason' => null,
        ]);

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    public function reject(Request $request, Course $course): CourseResource
    {
        abort_unless($request->user()->can('courses.moderate'), 403);
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);
        abort_unless($course->status === 'pending_review', 422, 'Only pending courses can be rejected.');
        $course->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'published_at' => null,
            'rejection_reason' => $data['reason'],
        ]);

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    public function archive(Request $request, Course $course): CourseResource
    {
        abort_unless($request->user()->can('courses.moderate'), 403);
        $course->update(['status' => 'archived', 'published_at' => null]);

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }
}
