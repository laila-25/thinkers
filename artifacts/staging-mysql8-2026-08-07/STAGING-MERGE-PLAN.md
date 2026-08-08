# THINKERS staging merge plan — not executed

## Scope and safety gates

- Production backup: `thinkers-production-backup.sql`
- Verified SHA-256: `640B0376A479EFD191BD6E6437EAB5D47DFCA38467310905D03AE1D9C3D380A5`
- Isolated local MySQL 8 staging schemas: `railway` (production snapshot) and `recovery_source` (local recovery source).
- No Railway connection is used by this plan.  The plan must first be executed and approved in staging; it must never copy `migrations`, `users`, `roles`, `permissions`, `model_has_roles`, sessions, cache, or jobs.

## Verified starting state

| Item | `railway` production snapshot | `recovery_source` |
|---|---:|---:|
| users | 1 | 19 |
| categories | 0 | 11 |
| courses | 0 | 26 (24 published, 2 drafts) |
| sections | 0 | 83 |
| lessons | 0 | 237 |
| quizzes / questions / answers | 0 / 0 / 0 | 72 / 216 / 864 |
| videos / attachments | 0 / 0 | 3 / 1 |
| Laravel migrations | 48 | 48 |

The administrator mapping is fixed:

| Source user | Target user | Required action |
|---|---|---|
| `3` / `marakshilaila@gmail.com` | `1` / `marakshilaila@gmail.com` | Preserve target row and target roles; never update it. |

All target catalog IDs are initially unallocated.  Do not assume they equal the source IDs.

## Instructor policy — decision required before execution

Source courses reference instructors `3`, `4`, `5`, and `20`–`25`.  Production contains only user `1`, the administrator.

The default safe policy is **no user import**: map every recovered course's `instructor_id` to target user `1`. This preserves the administrator account and restores content, but changes historical attribution. The alternative is to explicitly approve creating the eight missing instructor users and only their required instructor-role rows. Do not choose the alternative implicitly.

Draft source courses `37` and `38` are excluded. Published source course `39` is included despite its placeholder title because it has a section, video, attachment, enrollment, and thumbnail; obtain content-owner approval before publishing it in production.

## Staging-only mapping tables

Run the following only against a staging copy of the production snapshot. They are deliberately a plan, not an approved production script.

```sql
CREATE TABLE recovery_map_users (
  source_id BIGINT UNSIGNED PRIMARY KEY,
  target_id BIGINT UNSIGNED NOT NULL,
  resolution ENUM('preserved_admin','mapped_admin','created_user') NOT NULL
);

INSERT INTO recovery_map_users VALUES (3, 1, 'preserved_admin');
-- Default no-user-import policy:
INSERT INTO recovery_map_users VALUES
  (4,1,'mapped_admin'), (5,1,'mapped_admin'),
  (20,1,'mapped_admin'), (21,1,'mapped_admin'), (22,1,'mapped_admin'),
  (23,1,'mapped_admin'), (24,1,'mapped_admin'), (25,1,'mapped_admin');

CREATE TABLE recovery_map_categories (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL, source_slug VARCHAR(255) NOT NULL);
CREATE TABLE recovery_map_courses    (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL, source_slug VARCHAR(255) NOT NULL);
CREATE TABLE recovery_map_sections   (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL);
CREATE TABLE recovery_map_lessons    (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL);
CREATE TABLE recovery_map_quizzes    (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL);
CREATE TABLE recovery_map_questions  (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL);
CREATE TABLE recovery_map_answers    (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL);
CREATE TABLE recovery_map_videos     (source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL);
CREATE TABLE recovery_map_attachments(source_id BIGINT UNSIGNED PRIMARY KEY, target_id BIGINT UNSIGNED NOT NULL);
```

Each parent insert is followed by a natural-key lookup to fill its map table. If a target natural key already exists, record it as a conflict and stop for review; do not update target content automatically.

## Ordered merge algorithm

1. Begin a transaction for database rows. Lock the target admin row, verify `id=1`, email, and `admin` role, then commit/abort if it differs. Never write to that user or any authorization table.
2. Insert missing categories by `slug`, excluding the source ID. Fill `recovery_map_categories` by joining source and target on `slug`. Resolve `parent_id` only through this map.
3. Insert only source courses where `status='published'`, with mapped category and instructor IDs. Do not insert source IDs, `reviewed_by`, or source user references. Fill `recovery_map_courses` by `slug`.
4. Insert `course_sections` using mapped course IDs, then map them by `(target_course_id, position)`. Insert lessons using mapped section IDs, then map them by `(target_section_id, position)`.
5. Insert quizzes, then questions, then answers, mapping each child through its parent map. Preserve text, ordering, score, and publication fields. Do not copy learner quiz attempts.
6. Before video/attachment database inserts, copy the exact referenced objects to persistent destination storage, validate SHA-256, and rewrite `path` when mapped course or lesson IDs differ. Insert media rows using mapped lesson IDs only after each destination object exists.
7. Run foreign-key, count, and application-read checks. Commit only if all gates pass. Record every mapping and source/destination checksum in the migration manifest.

## Required column treatment

| Table | Natural key / mapping | Do not carry source ID |
|---|---|---|
| categories | `slug` | `id`, unresolved `parent_id` |
| courses | `slug` | `id`, `instructor_id`, `category_id`, `reviewed_by` |
| course_sections | mapped course + `position` | `id`, `course_id` |
| lessons | mapped section + `position` | `id`, `course_section_id` |
| quizzes | mapped lesson | `id`, `lesson_id` |
| questions | mapped quiz + `position` | `id`, `quiz_id` |
| answers | mapped question + `position` | `id`, `question_id` |
| videos | mapped lesson + source checksum/path | `id`, `lesson_id`, path prefix if IDs change |
| attachments | mapped lesson + source checksum/path | `id`, `lesson_id`, path prefix if IDs change |

## Media manifest and copy gates

The source records reference three videos and one attachment:

- `courses/1/lessons/1/videos/47c3e344-d874-4f8c-b3dc-07dd63a3f0c9.mp4`
- `courses/22/lessons/205/videos/fc167cee-447f-472e-a231-2210373aae51.mp4`
- `courses/39/lessons/393/videos/e5bcf349-c5b9-43ae-aa0d-2969c61030e9.mp4`
- `courses/39/lessons/393/attachments/bc3ccb00-7a24-48b9-b36e-cbdb7261063d.pdf`

For each, create a manifest containing source row ID, target lesson ID, source path, rewritten target path, byte length, and SHA-256. Copy to the configured persistent `course_media` disk, not Vercel and not Railway ephemeral storage. Copy course 39's thumbnail to the public disk and regenerate its production URL; its current `localhost` URL is invalid in production.

## Explicit exclusions

- No user records other than the immutable user map are merged.
- No roles, permissions, authorization joins, migrations, cache, sessions, jobs, orders, payments, reviews, progress, enrollments, certificates, or AI history are merged in this catalog/media phase.
- No draft course is inserted.
- No `DELETE`, `TRUNCATE`, `REPLACE`, schema drop, or production `db:seed` operation is permitted.

## Completion gates before any production proposal

1. Target admin still resolves to `id=1`, same email, and admin role.
2. Target migration list exactly matches production snapshot; no source migration row is copied.
3. Counts equal expected staged inserts: 11 categories, 24 published courses, and their mapped child records; source drafts remain absent.
4. Every foreign key resolves, every mapped slug is unique, and all copied media hashes match the source manifest.
5. Course, lesson, quiz, media delivery, and administrator login smoke tests pass in staging.
