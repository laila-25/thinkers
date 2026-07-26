<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LessonContentResource;
use App\Models\Lesson;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

class LessonPreviewController extends Controller
{
    public function show(Lesson $lesson): LessonContentResource
    {
        $this->ensurePreviewable($lesson);

        return new LessonContentResource($lesson->load(['video', 'attachments']));
    }

    public function video(Lesson $lesson): BinaryFileResponse
    {
        $this->ensurePreviewable($lesson);
        $video = $lesson->video;
        abort_unless($video && $video->processing_status === 'ready' && Storage::disk($video->disk)->exists($video->path), 404);

        $response = response()->file(Storage::disk($video->disk)->path($video->path), [
            'Content-Type' => $video->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $video->original_name);
        $response->setPrivate();
        $response->headers->addCacheControlDirective('no-store');

        return $response;
    }

    private function ensurePreviewable(Lesson $lesson): void
    {
        $lesson->loadMissing('section.course');
        abort_unless($lesson->is_preview && $lesson->is_published && $lesson->section->course->status === 'published', 404);
    }
}
