# Thinkers localization audit

## Scope

Audited all React source files under `src/pages`, `src/components`, `src/features`, `src/layouts`, and `src/context`. The project does not currently contain a `src/hooks` directory.

## Initial untranslated files

- `src/pages/About.jsx`, `Contact.jsx`, `Categories.jsx`, `CourseDetails.jsx`, `CoursePlayer.jsx`, `LessonPreview.jsx`, and `InstructorCurriculum.jsx`
- `src/components/CategoryCard.jsx`, `CourseReviews.jsx`, `Footer.jsx`, `GuestRoute.jsx`, `ProtectedRoute.jsx`, `PageLoadingTransition.jsx`, `QuizBuilder.jsx`, `QuizPlayer.jsx`, `RichTextEditor.jsx`, and `RoleDashboards.jsx`
- `src/features/ai/AICodeAssistant.jsx`, `AIMotivationCard.jsx`, `AIQuizGenerator.jsx`, `AIStudyTools.jsx`, and `aiTutorService.js`

## Translation coverage completed

- Landing, navbar, footer, About, Contact, authentication, shared loading and error states
- Course catalog, categories, course cards, course details, enrollment and reviews
- Student, instructor, and administrator dashboards and moderation actions
- Curriculum authoring, lesson preview/player, resources, progress, quiz builder/player
- AI Tutor, summaries, learning paths, quiz generation, code assistant, motivation and service defaults
- Form labels, placeholders, accessible names, confirmations, notices and empty states

## Translation architecture

- `common.json`: shared navigation, authentication, landing, informational pages, editor, actions and errors
- `dashboard.json`: student, instructor and administrator workflows
- `courses.json`: catalog, details, reviews, learning player, previews, curriculum and assessments
- `ai.json`: tutor, AI tools, defaults, prompts and AI errors

English and Arabic locale trees have identical key sets. API-provided values such as user names, course content, category names, review text and backend validation messages remain dynamic data and are not interface literals. Product marks such as `THINKERS` and the single-letter image fallback `T` are intentionally language-neutral.

## RTL verification

Arabic sets `html[lang="ar"]` and `dir="rtl"` before React starts and through `LanguageProvider`. Logical utilities (`text-start`, `text-end`, `ms-*`, `me-*`) are used in updated interactive layouts; the physical theme and language controls retain `dir="ltr"` where their animation geometry requires it.

## Validation

- English/Arabic translation-key parity: passed
- `npm run lint`: passed
- `npm run build`: passed
