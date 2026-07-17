<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLessonAttachmentRequest;
use App\Http\Requests\StoreLessonVideoRequest;
use App\Http\Requests\UpdateLessonContentRequest;
use App\Http\Resources\LessonContentResource;
use App\Models\Attachment;
use App\Models\Lesson;
use App\Services\HtmlSanitizer;
use App\Services\LessonMediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class LessonContentController extends Controller
{
    public function updateText(UpdateLessonContentRequest $request, Lesson $lesson, HtmlSanitizer $sanitizer): LessonContentResource
    {
        if ($lesson->content_type !== 'text') {
            throw ValidationException::withMessages(['content' => 'Only text lessons can store rich text content.']);
        }
        $lesson->update(['text_content' => $sanitizer->sanitize($request->validated('content')), 'content_updated_at' => now()]);

        return new LessonContentResource($lesson->fresh(['video', 'attachments']));
    }

    public function storeVideo(StoreLessonVideoRequest $request, Lesson $lesson, LessonMediaService $service): LessonContentResource
    {
        if ($lesson->content_type !== 'video') {
            throw ValidationException::withMessages(['video' => 'Video files can only be attached to video lessons.']);
        }
        $service->replaceVideo($lesson, $request->file('video'));
        $lesson->update(['content_updated_at' => now()]);

        return new LessonContentResource($lesson->fresh(['video', 'attachments']));
    }

    public function destroyVideo(Lesson $lesson, LessonMediaService $service): JsonResponse
    {
        Gate::authorize('manageContent', $lesson);
        abort_unless($lesson->video, 404);
        $service->deleteVideo($lesson->video);
        $lesson->update(['content_updated_at' => now()]);
        return response()->json(status: 204);
    }

    public function storeAttachment(StoreLessonAttachmentRequest $request, Lesson $lesson, LessonMediaService $service): LessonContentResource
    {
        $service->addAttachment($lesson, $request->file('file'), $request->validated('display_name'));
        $lesson->update(['content_updated_at' => now()]);
        return new LessonContentResource($lesson->fresh(['video', 'attachments']));
    }

    public function destroyAttachment(Attachment $attachment, LessonMediaService $service): JsonResponse
    {
        Gate::authorize('manageContent', $attachment->lesson);
        $service->deleteAttachment($attachment);
        return response()->json(status: 204);
    }
}
