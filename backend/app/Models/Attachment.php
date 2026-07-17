<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $fillable = ['lesson_id', 'disk', 'path', 'original_name', 'display_name', 'mime_type', 'extension', 'file_size', 'checksum', 'position', 'is_downloadable'];

    protected function casts(): array
    {
        return ['file_size' => 'integer', 'position' => 'integer', 'is_downloadable' => 'boolean'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
