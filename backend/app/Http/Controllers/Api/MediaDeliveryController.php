<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Lesson;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaDeliveryController extends Controller
{
    public function video(Lesson $lesson): BinaryFileResponse
    {
        Gate::authorize('view', $lesson);
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

    public function attachment(Attachment $attachment): StreamedResponse
    {
        Gate::authorize('view', $attachment->lesson);
        abort_unless($attachment->is_downloadable && Storage::disk($attachment->disk)->exists($attachment->path), 404);

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->original_name, [
            'Content-Type' => $attachment->mime_type,
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
