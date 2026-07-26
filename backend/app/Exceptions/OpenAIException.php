<?php

namespace App\Exceptions;

use RuntimeException;

class OpenAIException extends RuntimeException
{
    public function __construct(
        public readonly string $category,
        public readonly bool $retryable = false,
        public readonly ?int $httpStatus = null,
        ?\Throwable $previous = null,
    ) {
        parent::__construct(self::safeMessage($category), $httpStatus ?? 0, $previous);
    }

    public static function notConfigured(): self
    {
        return new self('not_configured');
    }

    private static function safeMessage(string $category): string
    {
        return match ($category) {
            'not_configured' => 'OpenAI is not configured.',
            'rate_limited' => 'The AI provider rate limit was reached.',
            'timeout', 'connection' => 'The AI provider could not be reached.',
            'authentication' => 'The AI provider rejected its credentials.',
            'invalid_request' => 'The AI provider rejected the request.',
            'invalid_response' => 'The AI provider returned an invalid response.',
            default => 'The AI provider request failed.',
        };
    }
}
