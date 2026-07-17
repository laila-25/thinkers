<?php

namespace App\Services;

use App\Models\Attachment;
use App\Models\Lesson;
use App\Models\Video;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LessonMediaService
{
    private const DISK = 'course_media';

    public function replaceVideo(Lesson $lesson, UploadedFile $file): Video
    {
        $path = $this->store($lesson, $file, 'videos');
        $old = $lesson->video;
        try {
            $video = DB::transaction(function () use ($lesson, $file, $path, $old): Video {
                $values = $this->metadata($file, $path) + [
                    'provider' => 'local', 'processing_status' => 'ready', 'processed_at' => now(),
                ];
                if ($old) {
                    $old->update($values);
                    return $old->fresh();
                }
                return $lesson->video()->create($values);
            });
        } catch (\Throwable $exception) {
            Storage::disk(self::DISK)->delete($path);
            throw $exception;
        }
        if ($old && $old->path !== $path) {
            Storage::disk($old->disk)->delete($old->path);
        }

        return $video;
    }

    public function addAttachment(Lesson $lesson, UploadedFile $file, ?string $displayName): Attachment
    {
        $path = $this->store($lesson, $file, 'attachments');
        try {
            return DB::transaction(fn () => $lesson->attachments()->create($this->metadata($file, $path) + [
                'display_name' => $displayName ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'extension' => strtolower($file->getClientOriginalExtension()),
                'position' => ((int) $lesson->attachments()->max('position')) + 1,
                'is_downloadable' => true,
            ]));
        } catch (\Throwable $exception) {
            Storage::disk(self::DISK)->delete($path);
            throw $exception;
        }
    }

    public function deleteVideo(Video $video): void
    {
        DB::transaction(fn () => $video->delete());
        Storage::disk($video->disk)->delete($video->path);
    }

    public function deleteAttachment(Attachment $attachment): void
    {
        DB::transaction(fn () => $attachment->delete());
        Storage::disk($attachment->disk)->delete($attachment->path);
    }

    private function store(Lesson $lesson, UploadedFile $file, string $type): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = "courses/{$lesson->section->course_id}/lessons/{$lesson->id}/{$type}/".Str::uuid().'.'.$extension;
        Storage::disk(self::DISK)->putFileAs(dirname($path), $file, basename($path));
        return $path;
    }

    private function metadata(UploadedFile $file, string $path): array
    {
        return [
            'disk' => self::DISK, 'path' => $path,
            'original_name' => basename($file->getClientOriginalName()),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'file_size' => $file->getSize(), 'checksum' => hash_file('sha256', $file->getRealPath()),
        ];
    }
}
