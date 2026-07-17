<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Lesson;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaDeliveryController extends Controller
{
    public function video(Lesson $lesson): StreamedResponse
    {
        Gate::authorize('view', $lesson);
        $video = $lesson->video;
        abort_unless($video && $video->processing_status === 'ready' && Storage::disk($video->disk)->exists($video->path), 404);

        return Storage::disk($video->disk)->response($video->path, $video->original_name, [
            'Content-Type' => $video->mime_type,
            'Content-Disposition' => 'inline; filename="'.addslashes($video->original_name).'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
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
