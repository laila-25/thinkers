<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LessonContentResource;
use App\Models\Lesson;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LessonPreviewController extends Controller
{
    public function show(Lesson $lesson): LessonContentResource
    {
        $this->ensurePreviewable($lesson);
        return new LessonContentResource($lesson->load(['video', 'attachments']));
    }

    public function video(Lesson $lesson): StreamedResponse
    {
        $this->ensurePreviewable($lesson);
        $video = $lesson->video;
        abort_unless($video && $video->processing_status === 'ready' && Storage::disk($video->disk)->exists($video->path), 404);
        return Storage::disk($video->disk)->response($video->path, $video->original_name, [
            'Content-Type' => $video->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private function ensurePreviewable(Lesson $lesson): void
    {
        $lesson->loadMissing('section.course');
        abort_unless($lesson->is_preview && $lesson->is_published && $lesson->section->course->status === 'published', 404);
    }
}
