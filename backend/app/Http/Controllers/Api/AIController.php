<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\OpenAIException;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateAiQuiz;
use App\Jobs\GenerateAiSummary;
use App\Models\AIConversation;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Services\GamificationService;
use App\Services\OpenAIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class AIController extends Controller
{
    public function __construct(private readonly OpenAIService $openAI, private readonly GamificationService $gamification) {}

    public function conversations(Request $request): JsonResponse
    {
        $items = $request->user()->aiConversations()
            ->with(['course:id,title', 'lesson:id,title'])
            ->withCount('messages')->latest('updated_at')->limit(50)->get();

        return response()->json(['data' => $items]);
    }

    public function createConversation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'title' => ['nullable', 'string', 'max:160'],
        ]);
        $context = $this->verifiedContext($request, $validated['course_id'] ?? null, $validated['lesson_id'] ?? null);
        $conversation = $request->user()->aiConversations()->create([
            'course_id' => $context['course_id'], 'lesson_id' => $context['lesson_id'],
            'title' => $validated['title'] ?? __('New learning conversation'),
        ]);

        return response()->json(['data' => $conversation->load('messages')], 201);
    }

    public function showConversation(Request $request, AIConversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate([
            'cursor' => ['sometimes', 'nullable', 'string'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $messages = $conversation->messages()
            ->reorder('id', 'desc')
            ->cursorPaginate($validated['per_page'] ?? 50, ['id', 'conversation_id', 'role', 'content', 'tokens_used', 'created_at'], 'cursor', $validated['cursor'] ?? null);

        $conversation->load(['course:id,title', 'lesson:id,title']);
        $conversation->setRelation('messages', $messages->getCollection()->reverse()->values());

        return response()->json(['data' => array_merge($conversation->toArray(), [
            'messages_pagination' => [
                'next_cursor' => $messages->nextCursor()?->encode(),
                'has_more' => $messages->hasMorePages(),
                'per_page' => $messages->perPage(),
            ],
        ])]);
    }

    public function deleteConversation(Request $request, AIConversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);
        $conversation->delete();

        return response()->json(status: 204);
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer', 'exists:ai_conversations,id'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id'],
            'messages' => ['sometimes', 'array', 'max:12'],
            'messages.*.role' => ['required_with:messages', 'in:user,assistant'],
            'messages.*.content' => ['required_with:messages', 'string', 'max:4000'],
            'context' => ['sometimes', 'array'],
            'context.course_title' => ['sometimes', 'nullable', 'string', 'max:300'],
            'context.lesson_title' => ['sometimes', 'nullable', 'string', 'max:300'],
            'context.category' => ['sometimes', 'nullable', 'string', 'max:150'],
            'context.level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'context.description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'context.lesson_content' => ['sometimes', 'nullable', 'string', 'max:15000'],
        ]);

        $conversation = isset($validated['conversation_id']) ? AIConversation::findOrFail($validated['conversation_id']) : null;
        if ($conversation) {
            $this->authorizeConversation($request, $conversation);
        }
        $context = $this->verifiedContext($request, $conversation?->course_id ?? ($validated['course_id'] ?? null), $conversation?->lesson_id ?? ($validated['lesson_id'] ?? null));
        if (! $conversation) {
            $conversation = $request->user()->aiConversations()->create([
                'course_id' => $context['course_id'], 'lesson_id' => $context['lesson_id'],
                'title' => Str::limit(trim($validated['question']), 80, '…'),
            ]);
        }

        $history = $conversation->messages()->latest('id')->limit(12)->get()->reverse()->map(fn ($message) => ['role' => $message->role, 'content' => $message->content])->values()->all();
        $conversation->messages()->create(['role' => 'user', 'content' => $validated['question']]);

        return $this->respond(function () use ($validated, $context, $history, $conversation) {
            $result = $this->openAI->chatWithUsage($validated['question'], $context['prompt'], $history);
            $message = $conversation->messages()->create(['role' => 'assistant', 'content' => $result['content'], 'tokens_used' => $result['tokens_used']]);
            $conversation->touch();
            $this->gamification->recordAiUsage($conversation->user);

            return ['response' => $result['content'], 'conversation_id' => $conversation->id, 'message' => $message];
        });
    }

    public function explainLesson(Request $request): JsonResponse
    {
        $validated = $request->validate(['lesson_id' => ['required', 'integer', 'exists:lessons,id']]);
        $context = $this->verifiedContext($request, null, $validated['lesson_id']);

        return $this->respond(fn () => ['explanation' => $this->openAI->explainLesson($context['prompt'])]);
    }

    public function summarizeLesson(Request $request): JsonResponse
    {
        $validated = $request->validate(['lesson_id' => ['required', 'integer', 'exists:lessons,id']]);
        $context = $this->verifiedContext($request, null, $validated['lesson_id']);

        return $this->respond(fn () => ['summary' => (new GenerateAiSummary($context['prompt']['lesson_content'] ?? $context['prompt']['lesson_description'] ?? $context['prompt']['lesson_title'], $context['prompt']['lesson_title']))->handle($this->openAI)]);
    }

    public function generateLessonQuiz(Request $request): JsonResponse
    {
        $validated = $request->validate(['lesson_id' => ['required', 'integer', 'exists:lessons,id']]);
        $context = $this->verifiedContext($request, null, $validated['lesson_id']);

        return $this->respond(fn () => ['questions' => (new GenerateAiQuiz($context['prompt']['lesson_title'], $context['prompt']['lesson_content'] ?? $context['prompt']['lesson_description'] ?? null))->handle($this->openAI)]);
    }

    public function summarize(Request $request): JsonResponse
    {
        $validated = $request->validate(['title' => ['sometimes', 'nullable', 'string', 'max:300'], 'content' => ['required', 'string', 'max:20000']]);

        return $this->respond(fn () => ['summary' => (new GenerateAiSummary($validated['content'], $validated['title'] ?? null))->handle($this->openAI)]);
    }

    public function generateQuiz(Request $request): JsonResponse
    {
        $validated = $request->validate(['lesson_id' => ['nullable', 'integer', 'exists:lessons,id'], 'topic' => ['required_without:lesson_id', 'nullable', 'string', 'max:500'], 'content' => ['sometimes', 'nullable', 'string', 'max:15000']]);
        if (isset($validated['lesson_id'])) {
            $context = $this->verifiedContext($request, null, $validated['lesson_id']);

            return $this->respond(fn () => ['questions' => (new GenerateAiQuiz($context['prompt']['lesson_title'], $context['prompt']['lesson_content'] ?? $context['prompt']['lesson_description'] ?? null))->handle($this->openAI)]);
        }

        return $this->respond(fn () => ['questions' => (new GenerateAiQuiz($validated['topic'], $validated['content'] ?? null))->handle($this->openAI)]);
    }

    private function verifiedContext(Request $request, ?int $courseId, ?int $lessonId): array
    {
        $lesson = $lessonId ? Lesson::with(['section.course.category', 'section.course.instructor'])->findOrFail($lessonId) : null;
        $course = $lesson?->section?->course ?: ($courseId ? Course::with(['category', 'instructor'])->findOrFail($courseId) : null);
        if ($courseId && $lesson && $course->id !== $courseId) {
            abort(422, 'The lesson does not belong to the selected course.');
        }
        if ($course) {
            $this->authorizeContext($request->user(), $course, $lesson);
        }

        return ['course_id' => $course?->id, 'lesson_id' => $lesson?->id, 'prompt' => array_filter([
            'course_title' => $course?->title, 'course_description' => $course?->description,
            'category' => $course?->category?->name, 'instructor' => $course?->instructor?->name,
            'level' => $course?->level, 'lesson_title' => $lesson?->title,
            'lesson_description' => $lesson?->description, 'lesson_content' => strip_tags((string) $lesson?->text_content),
            'lesson_type' => $lesson?->content_type,
        ], fn ($value) => $value !== null && $value !== '')];
    }

    private function authorizeContext(User $user, Course $course, ?Lesson $lesson): void
    {
        if ($user->hasRole('admin')) {
            return;
        }

        if ($user->isApprovedInstructor() && $course->instructor_id === $user->id) {
            return;
        }

        $studentHasAccess = $user->hasRole('student')
            && $course->status === 'published'
            && $course->published_at !== null
            && (! $lesson || $lesson->is_published)
            && $user->enrollments()
                ->where('course_id', $course->id)
                ->whereIn('status', ['active', 'completed'])
                ->exists();

        abort_unless($studentHasAccess, 403);
    }

    private function authorizeConversation(Request $request, AIConversation $conversation): void
    {
        abort_unless($conversation->user_id === $request->user()->id, 404);
    }

    private function respond(callable $action): JsonResponse
    {
        try {
            return response()->json(['data' => $action()]);
        } catch (Throwable $exception) {
            report($exception);
            $status = $exception instanceof OpenAIException && $exception->category === 'not_configured' ? 503 : 502;

            return response()->json(['message' => $status === 503 ? 'Thinkers AI is not configured yet.' : 'Thinkers AI is temporarily unavailable. Please try again.'], $status);
        }
    }
}
