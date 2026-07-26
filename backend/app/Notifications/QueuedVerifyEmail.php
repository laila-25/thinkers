<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class QueuedVerifyEmail extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct()
    {
        $this->onQueue('mail');
    }

    public function backoff(): array
    {
        return [10, 30, 60];
    }
}
