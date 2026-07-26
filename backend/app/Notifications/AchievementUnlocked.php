<?php

namespace App\Notifications;

use App\Models\Achievement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AchievementUnlocked extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly Achievement $achievement)
    {
        $this->afterCommit()->onQueue('default');
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return ['type' => 'achievement_unlocked', 'achievement_key' => $this->achievement->key, 'name' => $this->achievement->name, 'icon' => $this->achievement->icon];
    }
}
