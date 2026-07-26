<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Notifications\PlatformNotification;
use App\Services\AdminAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseModerationController extends Controller
{
    public function approve(Request $request, Course $course, AdminAuditService $audit): CourseResource
    {
        abort_unless($request->user()->can('courses.moderate'), 403);
        abort_unless($course->status === 'pending_review', 422, 'Only pending courses can be approved.');
        abort_unless($course->instructor->instructor_status === 'approved', 422, 'The instructor must be approved first.');

        DB::transaction(function () use ($course, $request): void {
            $course->update([
                'status' => 'published',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'published_at' => now(),
                'rejection_reason' => null,
            ]);

            // Draft lessons remain private during review. Publishing the
            // approved course must expose the curriculum reviewed with it.
            $course->lessons()->update(['is_published' => true]);
        });
        $audit->record($request, 'course.approved', $course);
        if ($course->instructor->allowsNotification('course_updates')) {
            $course->instructor->notify(new PlatformNotification(
                'course_approved', 'Course approved', "\"{$course->title}\" is now published.",
                "/instructor/courses/{$course->id}/builder", 'View course', 'course',
            ));
        }

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    public function reject(Request $request, Course $course, AdminAuditService $audit): CourseResource
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
        $audit->record($request, 'course.rejected', $course, ['reason' => $data['reason']]);
        if ($course->instructor->allowsNotification('course_updates')) {
            $course->instructor->notify(new PlatformNotification(
                'course_rejected', 'Course needs changes', $data['reason'],
                "/instructor/courses/{$course->id}/builder", 'Review feedback', 'feedback',
            ));
        }

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    public function archive(Request $request, Course $course, AdminAuditService $audit): CourseResource
    {
        abort_unless($request->user()->can('courses.moderate'), 403);
        $course->update(['status' => 'archived', 'published_at' => null]);
        $audit->record($request, 'course.archived', $course);

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }
}
