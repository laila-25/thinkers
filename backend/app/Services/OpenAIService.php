<?php

namespace App\Services;

use App\Exceptions\OpenAIException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    private const RESPONSES_ENDPOINT = 'https://api.openai.com/v1/responses';

    public function chat(string $question, array $context = [], array $messages = []): string
    {
        return $this->chatWithUsage($question, $context, $messages)['content'];
    }

    public function chatWithUsage(string $question, array $context = [], array $messages = []): array
    {
        $topic = $context['lesson_title'] ?? $context['course_title'] ?? 'the learner’s current topic';
        $contextText = $this->contextText($context);
        $input = collect($messages)
            ->take(-12)
            ->map(fn (array $message) => ['role' => $message['role'], 'content' => $message['content']])
            ->push(['role' => 'user', 'content' => $question])
            ->values()
            ->all();

        $response = $this->request([
            'instructions' => "You are Thinkers AI Tutor.\n\nYou are an educational AI assistant inside the Thinkers learning platform. Your goal is to help students understand their courses and improve how they learn.\n\nRules:\n- Use the verified current course and lesson context below. When a learner says 'this', infer the relevant concept from that context.\n- Explain concepts clearly and teach the reasoning instead of giving only an answer.\n- Provide practical examples when useful and adapt explanations to the student's stated level.\n- For programming questions, provide accurate, readable code examples and explain them.\n- Encourage the learner and suggest a useful next step without being repetitive.\n- Keep the response focused on education, courses, learning, or the current subject.\n- Never claim to have completed work the learner must do.\n\nLanguage behavior:\n- Detect the language of the latest user message and answer in that same language. Do not force one language.\n- For Arabic messages, use natural professional Arabic or clear educational Arabic while preserving familiar English technical terms when helpful.\n- For English messages, use professional, clear English.\n- For mixed Arabic-English messages, respond primarily in Arabic while preserving technical terms.\n- Follow an explicit request for a different response language.\n\nCurrent learning context (trusted platform data):\n{$contextText}\n\nPrimary topic: {$topic}",
            'input' => $input,
            'max_output_tokens' => $this->tokenLimit('chat', 900, 1200),
            'text' => ['verbosity' => 'medium'],
        ], 'chat');

        return ['content' => $this->outputText($response), 'tokens_used' => $this->tokensUsed($response)];
    }

    public function explainLesson(array $context): string
    {
        return $this->chat('Explain this lesson in a simple, structured way. Cover the central idea, the reasoning behind it, one useful example, and what I should remember.', $context);
    }

    public function summarize(string $content, ?string $title = null): array
    {
        $response = $this->request([
            'instructions' => 'Create a concise educational summary in the same language as the source. Preserve the core meaning, avoid inventing facts, use clear natural Arabic when the source is Arabic, and return the requested JSON structure.',
            'input' => 'Title: '.($title ?: 'Lesson')."\n\nContent:\n{$content}",
            'max_output_tokens' => $this->tokenLimit('summary', 700, 1000),
            'text' => ['format' => $this->summaryFormat(), 'verbosity' => 'low'],
        ], 'summary');

        return $this->decodeStructured($response);
    }

    public function generateQuiz(string $topic, ?string $content = null): array
    {
        $source = $content ? "Use this source material and do not introduce unsupported facts:\n{$content}" : 'Create a general conceptual quiz based on the supplied topic.';
        $response = $this->request([
            'instructions' => 'You are an educational assessment designer. Create exactly five useful multiple-choice questions in the same language as the source or topic, with four options each, one zero-based correct answer index, and a short teaching explanation. Use natural Arabic for Arabic material. Return only the requested JSON structure.',
            'input' => "Topic: {$topic}\n\n{$source}",
            'max_output_tokens' => $this->tokenLimit('quiz', 1800, 2200),
            'text' => ['format' => $this->quizFormat(), 'verbosity' => 'low'],
        ], 'quiz');

        return $this->decodeStructured($response)['questions'];
    }

    private function request(array $payload, string $operation): Response
    {
        $apiKey = config('services.openai.api_key');
        if (! is_string($apiKey) || $apiKey === '') {
            throw OpenAIException::notConfigured();
        }

        $startedAt = microtime(true);
        $attempts = max(1, min((int) config('services.openai.max_attempts', 3), 5));
        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                $response = Http::withToken($apiKey)
                    ->acceptJson()
                    ->asJson()
                    ->timeout(max(5, min((int) config('services.openai.timeout', 45), 90)))
                    ->connectTimeout(max(2, min((int) config('services.openai.connect_timeout', 10), 20)))
                    ->post(self::RESPONSES_ENDPOINT, [
                        'model' => config('services.openai.model', 'gpt-5.6-terra'),
                        'store' => false,
                        'reasoning' => ['effort' => 'low'],
                        ...$payload,
                    ]);
            } catch (ConnectionException $exception) {
                $error = new OpenAIException('connection', true, previous: $exception);
                $this->logFailure($operation, $error, $attempt);
                if ($attempt === $attempts) {
                    throw $error;
                }
                $this->backoff($attempt);

                continue;
            }

            if ($response->successful()) {
                Log::info('OpenAI request completed.', [
                    'operation' => $operation,
                    'model' => config('services.openai.model'),
                    'tokens' => $this->tokensUsed($response),
                    'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                    'provider_request_id' => $response->header('x-request-id'),
                    'attempts' => $attempt,
                ]);

                return $response;
            }

            $error = $this->classifyResponse($response);
            $this->logFailure($operation, $error, $attempt);
            if (! $error->retryable || $attempt === $attempts) {
                throw $error;
            }
            $this->backoff($attempt);
        }

        throw new OpenAIException('upstream');
    }

    private function outputText(Response $response): string
    {
        $direct = $response->json('output_text');
        if (is_string($direct) && $direct !== '') {
            return $direct;
        }

        $text = collect($response->json('output', []))
            ->flatMap(fn (array $item) => $item['content'] ?? [])
            ->first(fn (array $content) => ($content['type'] ?? null) === 'output_text')['text'] ?? null;

        if (! is_string($text) || $text === '') {
            throw new OpenAIException('invalid_response');
        }

        return $text;
    }

    private function decodeStructured(Response $response): array
    {
        $decoded = json_decode($this->outputText($response), true);
        if (! is_array($decoded)) {
            throw new OpenAIException('invalid_response');
        }

        return $decoded;
    }

    private function contextText(array $context): string
    {
        $labels = ['course_title' => 'Course', 'course_description' => 'Course description', 'category' => 'Category', 'instructor' => 'Instructor', 'level' => 'Student level', 'lesson_title' => 'Lesson', 'lesson_description' => 'Lesson description', 'lesson_content' => 'Lesson content', 'lesson_type' => 'Lesson type', 'description' => 'Additional description'];

        return collect($labels)->map(fn (string $label, string $key) => isset($context[$key]) && $context[$key] !== '' ? "{$label}: {$context[$key]}" : null)->filter()->implode("\n") ?: 'No additional course context was provided.';
    }

    private function tokensUsed(Response $response): ?int
    {
        $tokens = $response->json('usage.total_tokens');

        return is_int($tokens) ? $tokens : null;
    }

    private function tokenLimit(string $operation, int $default, int $hardMaximum): int
    {
        return max(100, min((int) config("services.openai.max_output_tokens.{$operation}", $default), $hardMaximum));
    }

    private function classifyResponse(Response $response): OpenAIException
    {
        $status = $response->status();
        $category = match (true) {
            $status === 429 => 'rate_limited',
            in_array($status, [401, 403], true) => 'authentication',
            in_array($status, [408, 409], true) => 'timeout',
            $status >= 500 => 'upstream',
            $status >= 400 && $status < 500 => 'invalid_request',
            default => 'upstream',
        };

        return new OpenAIException($category, $status === 429 || $status === 408 || $status === 409 || $status >= 500, $status);
    }

    private function backoff(int $attempt): void
    {
        $base = max(50, (int) config('services.openai.retry_base_ms', 250));
        $maximum = max($base, (int) config('services.openai.retry_max_ms', 2000));
        $milliseconds = min($base * (2 ** ($attempt - 1)), $maximum);
        usleep($milliseconds * 1000);
    }

    private function logFailure(string $operation, OpenAIException $exception, int $attempt): void
    {
        Log::warning('OpenAI request failed.', [
            'operation' => $operation,
            'category' => $exception->category,
            'status' => $exception->httpStatus,
            'retryable' => $exception->retryable,
            'attempt' => $attempt,
        ]);
    }

    private function summaryFormat(): array
    {
        return ['type' => 'json_schema', 'name' => 'lesson_summary', 'strict' => true, 'schema' => ['type' => 'object', 'properties' => ['title' => ['type' => 'string'], 'body' => ['type' => 'string'], 'takeaways' => ['type' => 'array', 'items' => ['type' => 'string'], 'minItems' => 3, 'maxItems' => 3]], 'required' => ['title', 'body', 'takeaways'], 'additionalProperties' => false]];
    }

    private function quizFormat(): array
    {
        $question = ['type' => 'object', 'properties' => ['question' => ['type' => 'string'], 'options' => ['type' => 'array', 'items' => ['type' => 'string'], 'minItems' => 4, 'maxItems' => 4], 'answer' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 3], 'explanation' => ['type' => 'string']], 'required' => ['question', 'options', 'answer', 'explanation'], 'additionalProperties' => false];

        return ['type' => 'json_schema', 'name' => 'lesson_quiz', 'strict' => true, 'schema' => ['type' => 'object', 'properties' => ['questions' => ['type' => 'array', 'items' => $question, 'minItems' => 5, 'maxItems' => 5]], 'required' => ['questions'], 'additionalProperties' => false]];
    }
}
