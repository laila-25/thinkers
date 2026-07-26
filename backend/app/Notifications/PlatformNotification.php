<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PlatformNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public readonly string $notificationType,
        public readonly string $title,
        public readonly string $message,
        public readonly ?string $destination = null,
        public readonly ?string $actionLabel = null,
        public readonly ?string $icon = null,
    ) {
        $this->afterCommit()->onQueue('default');
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->notificationType,
            'title' => $this->title,
            'message' => $this->message,
            'destination' => $this->destination,
            'action_label' => $this->actionLabel,
            'icon' => $this->icon,
        ];
    }
}
