<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CertificateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'certificate_number' => $this->certificate_number,
            'verification_code' => $this->verification_code,
            'issued_at' => $this->issued_at?->toISOString(),
            'status' => $this->status,
            'course' => [
                'id' => $this->course->id,
                'title' => $this->course->title,
                'instructor' => $this->course->instructor?->name,
            ],
            'download_url' => $this->status === 'issued' ? "/api/certificates/{$this->id}/download" : null,
            'verification_url' => '/verify/'.$this->verification_code,
        ];
    }
}
