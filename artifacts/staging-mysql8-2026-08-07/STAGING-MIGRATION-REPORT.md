# THINKERS staging migration report

## Result

The catalog/media merge was executed **only** in the isolated local MySQL staging schema `railway` on `127.0.0.1:3308`. Railway production was not connected to, imported into, or modified.

- Production-backup SHA-256 verified: `640B0376A479EFD191BD6E6437EAB5D47DFCA38467310905D03AE1D9C3D380A5`
- Recovery source: `thinkers-local-2026-08-07.sql`
- Source drafts excluded: course IDs `37` and `38`
- Published courses merged: 24
- No source users, roles, permissions, authorization joins, migrations, enrollments, certificates, sessions, cache, jobs, or payments were merged.

## Administrator and instructor handling

| Source | Staging target | Result |
|---|---|---|
| user `3` / `marakshilaila@gmail.com` | user `1` / `marakshilaila@gmail.com` | Existing target user preserved; no fields or roles changed. |
| source instructors `4`, `5`, `20`–`25` | user `1` | No instructor users imported. All 24 recovered courses are owned by the existing administrator. |

The target administrator still has only the `admin` role. All recovered courses have `instructor_id = 1`.

## Verified staging counts

| Table | Result |
|---|---:|
| categories | 11 |
| published courses | 24 |
| course sections | 83 |
| lessons | 237 |
| quizzes | 72 |
| questions | 216 |
| answers | 864 |
| videos | 3 |
| attachments | 1 |
| migrations | 48 |

All foreign-key integrity checks returned zero orphans for category parents, course references, sections, lessons, quizzes, questions, answers, videos, and attachments. The staging and recovery source migration lists both contain the same 48 migration names; no migration records were copied.

## ID mapping baseline

The full section, lesson, quiz, question, and answer mappings are retained in staging tables `recovery_map_sections`, `recovery_map_lessons`, `recovery_map_quizzes`, `recovery_map_questions`, and `recovery_map_answers`. Their counts are 83, 237, 72, 216, and 864 respectively.

### Categories

| Source ID | Staging ID | Slug |
|---:|---:|---|
| 1 | 1 | programming |
| 2 | 2 | business |
| 3 | 3 | design |
| 4 | 4 | languages |
| 12 | 5 | web-development |
| 13 | 6 | mobile-development |
| 14 | 7 | artificial-intelligence |
| 15 | 8 | data-science |
| 16 | 9 | cybersecurity |
| 17 | 10 | ui-ux-design |
| 18 | 11 | marketing |

### Published courses

| Source ID | Staging ID | Slug |
|---:|---:|---|
| 1 | 1 | modern-web-development |
| 2 | 2 | laravel-api-development |
| 3 | 5 | digital-marketing-essentials |
| 4 | 6 | project-management-fundamentals |
| 5 | 9 | ui-ux-design-foundations |
| 6 | 10 | professional-english-communication |
| 20 | 3 | python-programming-zero-to-projects |
| 21 | 4 | clean-code-and-software-design |
| 22 | 11 | modern-html-css-and-javascript |
| 23 | 12 | laravel-12-api-engineering |
| 24 | 13 | react-and-vite-in-production |
| 25 | 14 | flutter-app-development |
| 26 | 15 | react-native-build-and-ship |
| 27 | 16 | generative-ai-foundations |
| 28 | 17 | applied-machine-learning-with-python |
| 29 | 18 | data-analysis-with-python-and-pandas |
| 30 | 19 | sql-for-analytics |
| 31 | 20 | cybersecurity-essentials |
| 32 | 21 | web-application-security |
| 33 | 22 | uiux-design-foundations |
| 34 | 7 | product-management-fundamentals |
| 35 | 8 | agile-project-leadership |
| 36 | 23 | digital-marketing-strategy |
| 39 | 24 | course-3 |

Course source ID `39` was included because it is marked published and has linked media, but its placeholder title should be reviewed before any production proposal.

## Media verification

Private staging media was copied to `media/course-media`; the staging thumbnail was copied to `media/public`. Every copy matched its source SHA-256 and every database media record points to the remapped path.

| Kind | Source row → staging row | Staging path |
|---|---|---|
| video | `1 → 1` | `courses/1/lessons/2/videos/47c3e344-d874-4f8c-b3dc-07dd63a3f0c9.mp4` |
| video | `2 → 2` | `courses/11/lessons/53/videos/fc167cee-447f-472e-a231-2210373aae51.mp4` |
| video | `3 → 3` | `courses/24/lessons/237/videos/e5bcf349-c5b9-43ae-aa0d-2969c61030e9.mp4` |
| attachment | `1 → 1` | `courses/24/lessons/237/attachments/bc3ccb00-7a24-48b9-b36e-cbdb7261063d.pdf` |
| thumbnail | course `39 → 24` | `courses/24/thumbnail-f6df28a5-bdc7-46ee-9364-08f857770c4f.png` |

The course 39 thumbnail URL was changed only in staging from the invalid localhost URL to `https://staging-recovery.local/storage/...`. A future production migration must upload it to persistent production public storage and generate the actual production URL. No Railway storage was touched.

## Preconditions for a future production proposal

1. Take a fresh production backup immediately before the approved production window and compare it with the verified backup.
2. Re-run this mapping against that fresh snapshot; do not reuse staging IDs as production IDs.
3. Upload files to persistent production storage and validate hashes before inserting video/attachment rows.
4. Reconfirm the administrator email, ID, and `admin` role under a row lock.
5. Run the data-only merge in one approved maintenance window. Do not deploy code, run `db:seed`, copy `migrations`, or use destructive SQL.
