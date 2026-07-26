<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourseMediaController extends Controller
{
    public function thumbnail(Request $request, Course $course): CourseResource
    {
        Gate::authorize('update', $course);
        $request->validate(['thumbnail' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120']]);
        $file = $request->file('thumbnail');
        $path = $file->storeAs("courses/{$course->id}", 'thumbnail-'.Str::uuid().'.'.strtolower($file->extension()), 'public');
        $old = $course->thumbnail;
        $course->update(['thumbnail' => Storage::disk('public')->url($path)]);
        if ($old && str_contains($old, '/storage/courses/')) {
            Storage::disk('public')->delete(Str::after($old, '/storage/'));
        }

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    public function promotionalVideo(Request $request, Course $course): CourseResource
    {
        Gate::authorize('update', $course);
        $request->validate(['video' => ['required', 'file', 'max:524288', 'mimes:mp4,webm,mov', 'mimetypes:video/mp4,video/webm,video/quicktime']]);
        $file = $request->file('video');
        $path = "courses/{$course->id}/promotional/".Str::uuid().'.'.strtolower($file->extension());
        Storage::disk('course_media')->putFileAs(dirname($path), $file, basename($path));
        if ($course->promotional_video_path) {
            Storage::disk('course_media')->delete($course->promotional_video_path);
        }
        $course->update(['promotional_video_path' => $path]);

        return new CourseResource($course->fresh(['instructor:id,name', 'category']));
    }

    public function stream(Course $course)
    {
        $allowed = request()->user()->hasRole('admin')
            || (request()->user()->isApprovedInstructor() && $course->instructor_id === request()->user()->id);
        abort_unless($allowed && $course->promotional_video_path, 403);

        return Storage::disk('course_media')->response($course->promotional_video_path);
    }
}
