<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = is_array($this->data) ? $this->data : [];

        return [
            'id' => $this->id,
            'type' => $data['type'] ?? class_basename($this->type),
            'title' => $data['title'] ?? $data['name'] ?? 'Thinkers notification',
            'message' => $data['message'] ?? null,
            'icon' => $data['icon'] ?? null,
            'action_label' => $data['action_label'] ?? null,
            'destination' => $this->safeDestination($data['destination'] ?? null),
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    private function safeDestination(mixed $destination): ?string
    {
        if (! is_string($destination) || ! str_starts_with($destination, '/') || str_starts_with($destination, '//')) {
            return null;
        }

        return mb_substr($destination, 0, 2048);
    }
}
