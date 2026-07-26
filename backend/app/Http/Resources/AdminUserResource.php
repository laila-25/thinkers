<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values()),
            'instructor_status' => $this->instructor_status,
            'courses_count' => (int) ($this->courses_count ?? 0),
            'enrollments_count' => (int) ($this->enrollments_count ?? 0),
            'ai_conversations_count' => (int) ($this->ai_conversations_count ?? 0),
            'created_at' => $this->created_at,
        ];
    }
}
