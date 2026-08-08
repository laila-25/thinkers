# Production runner — review and dry-run only

`production-catalog-recovery.ps1` defaults to dry-run. It reads the isolated `recovery_source` database and Railway MySQL, verifies the protected administrator and migrations, calculates the eligible catalog import, checks source media hashes, and writes a JSON report. It does not write to Railway unless `-Execute` is explicitly supplied.

## Prerequisites

1. Keep the isolated source MySQL instance running on `127.0.0.1:3308` with `recovery_source` loaded.
2. Open a Railway MySQL tunnel in a separate PowerShell window and leave it running:

```powershell
railway connect --tunnel-only --ssh --service "<mysql-service-name>" --environment Production --port 3307
```

3. Obtain the Railway MySQL username from the database service variables. The runner prompts for the password without showing it.

## Exact dry-run command

Run this from the repository root after replacing only the username:

```powershell
& "C:\xampp\htdocs\thinkers\artifacts\staging-mysql8-2026-08-07\production-catalog-recovery.ps1" `
  -ProductionHost 127.0.0.1 `
  -ProductionPort 3307 `
  -ProductionUser "<MYSQLUSER>" `
  -ProductionDatabase railway
```

Review the generated `production-recovery-*.json` report. A dry-run passes only when the production administrator is present, migration counts match, recovery source media hashes match, and no category/course slug conflict exists.

## Execute mode is intentionally blocked until media storage is available

The runner will only execute after an explicit `-Execute` and after it has created and hashed a fresh production backup. It also requires filesystem paths to the **persistent production** `course_media` and public-storage roots, plus the exact public URL prefix. A Railway container filesystem is not an acceptable destination unless it is a mounted persistent Volume; S3/R2 requires an upload adapter instead of local paths.

Do not use `-Execute` until the actual production media storage is identified and a fresh dry-run report is approved. The execute path inserts only categories, published courses, sections, lessons, quizzes, questions, answers, videos, attachments, and their referenced media; it refuses slug conflicts and does not import users, roles, permissions, sessions, cache, jobs, or migrations.
