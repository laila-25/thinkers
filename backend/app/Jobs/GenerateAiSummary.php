<?php

namespace App\Jobs;

use App\Services\OpenAIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateAiSummary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 90;

    public bool $failOnTimeout = true;

    public function __construct(public string $content, public ?string $title = null)
    {
        $this->onQueue('ai');
    }

    public function handle(OpenAIService $openAI): array
    {
        return $openAI->summarize($this->content, $this->title);
    }

    public function backoff(): array
    {
        return [5, 15, 45];
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('AI summary job failed.', ['job' => self::class, 'exception' => $exception ? $exception::class : null]);
    }
}
