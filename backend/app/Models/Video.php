<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Video extends Model
{
    protected $fillable = ['lesson_id', 'disk', 'path', 'original_name', 'mime_type', 'file_size', 'duration_seconds', 'checksum', 'provider', 'provider_asset_id', 'processing_status', 'processing_error', 'processed_at'];

    protected function casts(): array
    {
        return ['file_size' => 'integer', 'duration_seconds' => 'integer', 'processed_at' => 'datetime'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
