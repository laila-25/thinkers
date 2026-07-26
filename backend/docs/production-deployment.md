# Thinkers backend production deployment

## Required services

- PHP 8.2+ with the `phpredis` extension
- MySQL 8+
- Redis 7+
- A process supervisor such as Supervisor or systemd
- A scheduler entry that runs `php artisan schedule:run` every minute

Use TLS and authentication for remote Redis. The sample environment assigns logical Redis databases by workload:

| Workload | Database |
| --- | ---: |
| General/default | 0 |
| Cache | 1 |
| Sanctum sessions | 2 |
| Queues | 3 |
| Rate limiting | 4 |

For higher isolation, use separate Redis instances for durable queues/sessions and evictable cache data. Do not apply an eviction policy to queue or session data; use `noeviction` and monitor memory.

## Production environment

Start from `.env.example`, set `APP_ENV=production`, `APP_DEBUG=false`, a generated `APP_KEY`, production URLs, database credentials, Redis credentials, mail transport, and `OPENAI_API_KEY`.

The production infrastructure settings are:

```dotenv
CACHE_STORE=redis
CACHE_LIMITER=limiter
SESSION_DRIVER=redis
SESSION_CONNECTION=session
QUEUE_CONNECTION=redis
REDIS_QUEUE_CONNECTION=queue
```

Local development can continue without Redis by using:

```dotenv
CACHE_STORE=database
CACHE_LIMITER=database
SESSION_DRIVER=database
SESSION_CONNECTION=
QUEUE_CONNECTION=sync
```

Tests retain the in-memory array cache/session and synchronous queue configured in `phpunit.xml`.

## Deployment commands

```bash
composer install --no-dev --classmap-authoritative
php artisan migrate --force
php artisan optimize
php artisan queue:restart
```

After deployment, verify Redis and application health:

```bash
php artisan about
php artisan queue:monitor redis:default,redis:mail,redis:ai --max=100
curl --fail https://api.example.com/up
```

## Queue workers

Run AI generation separately from mail and normal work so slow provider calls cannot exhaust every worker.

```ini
[program:thinkers-default]
command=php /var/www/thinkers/backend/artisan queue:work redis --queue=mail,certificates,default --sleep=1 --tries=3 --timeout=60 --max-time=3600
numprocs=2
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
redirect_stderr=true
stdout_logfile=/var/log/thinkers-worker.log

[program:thinkers-ai]
command=php /var/www/thinkers/backend/artisan queue:work redis --queue=ai --sleep=1 --tries=3 --timeout=100 --max-jobs=100
numprocs=2
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
redirect_stderr=true
stdout_logfile=/var/log/thinkers-ai-worker.log
```

Keep AI worker concurrency intentionally low and increase it only after reviewing provider rate limits, latency, token usage, and Redis queue depth.

Failed jobs remain in MySQL for operational recovery:

```bash
php artisan queue:failed
php artisan queue:retry all
php artisan queue:prune-failed --hours=168
```

## AI response compatibility

Interactive chat is never queued. Summary and quiz generation are encapsulated in retryable queue jobs, but existing HTTP endpoints invoke the same job handlers synchronously to preserve their current JSON responses. Fully asynchronous endpoint execution requires a persisted generation record and frontend polling or push notifications; enable that only as a coordinated API/frontend change.

No report-generation or certificate-generation service currently exists in the backend. When those workflows are implemented, dispatch their preparation jobs onto dedicated `reports` and `certificates` queues instead of performing document generation in HTTP requests.

## Monitoring and security

- Alert on failed jobs, queue depth, worker restarts, Redis memory, HTTP 5xx rate, slow requests, and AI failure categories.
- OpenAI logs contain operation, model, token count, duration, status category, and provider request ID only.
- Queue and exception logs contain class names and operational metadata only.
- Prompts, AI responses, passwords, request bodies, session values, and API keys must never be logged.
- Route application logs to centralized storage and set retention/access policies appropriate for production.
