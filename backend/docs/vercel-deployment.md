# Thinkers Laravel backend on Vercel

## Vercel project

Create a separate Vercel project for the backend and set its **Root Directory**
to `backend`. Vercel will detect `Dockerfile.vercel` as a Docker Function and
route the project to the Apache/Laravel application listening on `PORT`.

Copy the variable names from `.env.vercel.example` into the Vercel project
settings. Never upload a real `.env` file or commit secret values. Generate
`APP_KEY` once with:

```sh
php artisan key:generate --show
```

Set the generated value as the Vercel `APP_KEY` environment variable.

## Database

Use an externally hosted MySQL service that accepts connections from Vercel.
Apply migrations from a trusted CI job or an administrator machine:

```sh
php artisan migrate --force
```

Migrations are intentionally not run during container startup so concurrent
cold starts cannot race with each other.

The Vercel template uses the database for sessions and cache. Existing
database migrations already provide the required tables.

## Sanctum SPA authentication

For separate `*.vercel.app` frontend and backend domains, set:

```dotenv
APP_URL=https://your-backend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-frontend.vercel.app
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
SESSION_PARTITIONED_COOKIE=true
```

The React HTTP client must continue sending credentials and must request
`/sanctum/csrf-cookie` before login.

Custom sibling domains are more reliable because browsers increasingly restrict
third-party cookies. The preferred production setup is:

- Frontend: `https://app.example.com`
- Backend: `https://api.example.com`
- `SANCTUM_STATEFUL_DOMAINS=app.example.com`
- `SESSION_DOMAIN=.example.com`
- `SESSION_SAME_SITE=lax`
- `SESSION_PARTITIONED_COOKIE=false`

## Storage

The Vercel filesystem is stateless. `Dockerfile.vercel` maps Laravel's writable
cache and temporary local storage paths to `/tmp`, which fixes permission
errors but does not make uploaded files persistent.

Configure an S3-compatible object store and set:

```dotenv
FILESYSTEM_DISK=s3
CERTIFICATE_FILESYSTEM_DRIVER=s3
PUBLIC_FILESYSTEM_DRIVER=s3
```

The named filesystems are ready for S3-compatible services such as AWS S3,
Cloudflare R2, or another provider supported by the S3 API.

`COURSE_MEDIA_FILESYSTEM_DRIVER` remains `local` in the deployment template.
The current private lesson-video endpoints call the local-only `path()` method.
Switching that disk to S3 requires a separate, authorized media-delivery change
(for example, short-lived signed URLs or streamed storage responses). That
application change is intentionally outside this deployment-only update.

Large browser uploads also should go directly to object storage using signed
uploads rather than pass through a Vercel Function.

## Queues and scheduled tasks

Vercel Docker Functions do not provide a persistent Laravel queue worker. The
template uses `QUEUE_CONNECTION=sync` so current notifications and jobs still
execute instead of remaining unprocessed. Heavy AI/media jobs may exceed request
limits and should ultimately run on a separate persistent worker service.

If scheduled commands are added, invoke a protected scheduler endpoint with
Vercel Cron or run `php artisan schedule:run` from external infrastructure.

## Logs and health

Production logging is sent to `stderr` and is visible in Vercel logs. The
Laravel health endpoint is:

```text
GET /up
```
