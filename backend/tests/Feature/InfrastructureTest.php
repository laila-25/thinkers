<?php

namespace Tests\Feature;

use App\Jobs\GenerateAiQuiz;
use App\Jobs\GenerateAiSummary;
use App\Notifications\QueuedResetPassword;
use App\Notifications\QueuedVerifyEmail;
use App\Services\OpenAIService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class InfrastructureTest extends TestCase
{
    public function test_ai_generation_jobs_are_queueable_on_the_ai_queue(): void
    {
        Queue::fake();

        GenerateAiSummary::dispatch('Lesson content', 'Lesson title');
        GenerateAiQuiz::dispatch('Lesson title', 'Lesson content');

        Queue::assertPushedOn('ai', GenerateAiSummary::class);
        Queue::assertPushedOn('ai', GenerateAiQuiz::class);
    }

    public function test_authentication_notifications_are_queueable(): void
    {
        $this->assertInstanceOf(ShouldQueue::class, new QueuedVerifyEmail);
        $this->assertInstanceOf(ShouldQueue::class, new QueuedResetPassword('token'));
    }

    public function test_openai_retries_transient_failures_and_caps_output_tokens(): void
    {
        config([
            'services.openai.api_key' => 'test-key',
            'services.openai.max_attempts' => 2,
            'services.openai.retry_base_ms' => 1,
            'services.openai.max_output_tokens.summary' => 100000,
        ]);
        Http::fakeSequence()
            ->push(['error' => ['message' => 'Temporary provider error']], 500)
            ->push([
                'output_text' => json_encode([
                    'title' => 'Reliable summary',
                    'body' => 'Summary body',
                    'takeaways' => ['One', 'Two', 'Three'],
                ], JSON_THROW_ON_ERROR),
                'usage' => ['total_tokens' => 100],
            ]);

        $summary = app(OpenAIService::class)->summarize('Content', 'Title');

        $this->assertSame('Reliable summary', $summary['title']);
        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request): bool => $request['max_output_tokens'] === 1000);
    }
}
