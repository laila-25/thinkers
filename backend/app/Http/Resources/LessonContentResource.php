<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'content_type' => $this->content_type,
            'text_content' => $this->when($this->content_type === 'text', $this->text_content),
            'duration' => $this->duration,
            'position' => $this->position,
            'is_preview' => $this->is_preview,
            'quiz' => $this->whenLoaded('quiz', fn () => $this->quiz ? [
                'id' => $this->quiz->id, 'title' => $this->quiz->title, 'status' => $this->quiz->status,
            ] : null),
            'video' => $this->whenLoaded('video', fn () => $this->video ? [
                'id' => $this->video->id,
                'original_name' => $this->video->original_name,
                'mime_type' => $this->video->mime_type,
                'file_size' => $this->video->file_size,
                'duration_seconds' => $this->video->duration_seconds,
                'processing_status' => $this->video->processing_status,
                'stream_url' => route('lessons.video.stream', $this->resource, absolute: false),
            ] : null),
            'attachments' => $this->whenLoaded('attachments', fn () => $this->attachments->map(fn ($attachment) => [
                'id' => $attachment->id,
                'display_name' => $attachment->display_name,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'file_size' => $attachment->file_size,
                'download_url' => route('attachments.download', $attachment, absolute: false),
            ])),
        ];
    }
}
