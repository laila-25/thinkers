<?php

namespace Tests\Feature;

use App\Models\AIConversation;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AIIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        config(['services.openai.api_key' => 'test-secret-key', 'services.openai.model' => 'gpt-5.6-terra']);
    }

    public function test_ai_routes_require_authentication(): void
    {
        $this->postJson('/api/ai/chat', ['question' => 'Explain loops'])->assertUnauthorized();
        $this->postJson('/api/ai/summarize', ['content' => 'Lesson content'])->assertUnauthorized();
        $this->postJson('/api/ai/generate-quiz', ['topic' => 'Loops'])->assertUnauthorized();
    }

    public function test_chat_sends_server_side_openai_request_and_returns_text(): void
    {
        Http::fake(['api.openai.com/*' => Http::response($this->textResponse('A loop repeats instructions until its condition changes.'))]);

        $this->actingAs(User::factory()->create())->postJson('/api/ai/chat', [
            'question' => 'Explain loops simply.',
            'context' => ['course_title' => 'Programming Basics', 'lesson_title' => 'Loops'],
        ])->assertOk()->assertJsonPath('data.response', 'A loop repeats instructions until its condition changes.');

        Http::assertSent(function (Request $request) {
            return $request->url() === 'https://api.openai.com/v1/responses'
                && $request->hasHeader('Authorization', 'Bearer test-secret-key')
                && $request['model'] === 'gpt-5.6-terra'
                && $request['store'] === false;
        });
    }

    public function test_chat_prompt_supports_arabic_english_and_mixed_language_messages(): void
    {
        $cases = [
            ['question' => 'اشرح لي recursion', 'response' => 'Recursion هي تقنية تستدعي فيها الدالة نفسها.'],
            ['question' => 'Explain recursion', 'response' => 'Recursion is a programming technique in which a function calls itself.'],
            ['question' => 'اشرحلي binary search algorithm', 'response' => 'خوارزمية binary search تبحث في بيانات مرتبة بتقسيم نطاق البحث إلى نصفين.'],
        ];

        Http::fakeSequence()
            ->push($this->textResponse($cases[0]['response']))
            ->push($this->textResponse($cases[1]['response']))
            ->push($this->textResponse($cases[2]['response']));

        $user = User::factory()->create();

        foreach ($cases as $case) {
            $this->actingAs($user)->postJson('/api/ai/chat', ['question' => $case['question']])
                ->assertOk()
                ->assertJsonPath('data.response', $case['response']);
        }

        $requests = Http::recorded()->map(fn (array $record) => $record[0]);

        $this->assertCount(3, $requests);
        $this->assertSame(array_column($cases, 'question'), $requests->map(fn (Request $request) => $request['input'][0]['content'])->all());

        foreach ($requests as $request) {
            $instructions = $request['instructions'];
            $this->assertStringContainsString('Detect the language of the latest user message', $instructions);
            $this->assertStringContainsString('For Arabic messages', $instructions);
            $this->assertStringContainsString('For English messages', $instructions);
            $this->assertStringContainsString('For mixed Arabic-English messages', $instructions);
            $this->assertSame('gpt-5.6-terra', $request['model']);
            $this->assertFalse($request['store']);
        }
    }

    public function test_summary_and_quiz_return_structured_ai_data(): void
    {
        $summary = ['title' => 'Loops', 'body' => 'Loops repeat work.', 'takeaways' => ['Know the condition', 'Update state', 'Avoid infinite loops']];
        $questions = collect(range(1, 5))->map(fn ($number) => ['question' => "Question {$number}?", 'options' => ['A', 'B', 'C', 'D'], 'answer' => 0, 'explanation' => 'A is correct.'])->all();
        Http::fakeSequence()
            ->push($this->textResponse(json_encode($summary, JSON_THROW_ON_ERROR)))
            ->push($this->textResponse(json_encode(['questions' => $questions], JSON_THROW_ON_ERROR)));
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/ai/summarize', ['title' => 'Loops', 'content' => 'Loops repeat a block of code.'])
            ->assertOk()->assertJsonPath('data.summary.title', 'Loops')->assertJsonCount(3, 'data.summary.takeaways');
        $this->actingAs($user)->postJson('/api/ai/generate-quiz', ['topic' => 'Loops', 'content' => 'Loops repeat a block of code.'])
            ->assertOk()->assertJsonCount(5, 'data.questions')->assertJsonPath('data.questions.0.answer', 0);
    }

    public function test_chat_history_is_persisted_and_owned_by_the_student(): void
    {
        Http::fake(['api.openai.com/*' => Http::response($this->textResponse('A clear explanation.'))]);
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/ai/chat', ['question' => 'Explain this concept.'])
            ->assertOk()->assertJsonPath('data.response', 'A clear explanation.');
        $conversationId = $response->json('data.conversation_id');

        $this->assertDatabaseHas('ai_conversations', ['id' => $conversationId, 'user_id' => $user->id]);
        $this->assertDatabaseHas('ai_messages', ['conversation_id' => $conversationId, 'role' => 'user', 'content' => 'Explain this concept.']);
        $this->assertDatabaseHas('ai_messages', ['conversation_id' => $conversationId, 'role' => 'assistant', 'content' => 'A clear explanation.']);
        $this->actingAs($user)->getJson("/api/ai/conversations/{$conversationId}")->assertOk()->assertJsonCount(2, 'data.messages');

        $this->actingAs(User::factory()->create())->getJson("/api/ai/conversations/{$conversationId}")->assertNotFound();
        $this->actingAs($user)->deleteJson("/api/ai/conversations/{$conversationId}")->assertNoContent();
        $this->assertDatabaseMissing('ai_conversations', ['id' => $conversationId]);
    }

    public function test_conversation_messages_are_cursor_paginated_without_bypassing_ownership(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $conversation = AIConversation::create(['user_id' => $owner->id, 'title' => 'Long conversation']);

        foreach (range(1, 120) as $number) {
            $conversation->messages()->create([
                'role' => $number % 2 === 0 ? 'assistant' : 'user',
                'content' => "Message {$number}",
            ]);
        }

        $firstPage = $this->actingAs($owner)->getJson("/api/ai/conversations/{$conversation->id}")
            ->assertOk()
            ->assertJsonCount(50, 'data.messages')
            ->assertJsonPath('data.messages.0.content', 'Message 71')
            ->assertJsonPath('data.messages.49.content', 'Message 120')
            ->assertJsonPath('data.messages_pagination.has_more', true);

        $cursor = $firstPage->json('data.messages_pagination.next_cursor');
        $this->assertNotEmpty($cursor);

        $this->actingAs($owner)->getJson("/api/ai/conversations/{$conversation->id}?cursor=".urlencode($cursor))
            ->assertOk()
            ->assertJsonCount(50, 'data.messages')
            ->assertJsonPath('data.messages.0.content', 'Message 21')
            ->assertJsonPath('data.messages.49.content', 'Message 70');

        $this->actingAs($otherUser)->getJson("/api/ai/conversations/{$conversation->id}?cursor=".urlencode($cursor))
            ->assertNotFound();
        $this->actingAs($owner)->getJson("/api/ai/conversations/{$conversation->id}?per_page=101")
            ->assertUnprocessable();
    }

    public function test_ai_validation_and_configuration_errors_are_safe(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/ai/chat', ['question' => ''])->assertUnprocessable();
        config(['services.openai.api_key' => null]);
        $this->actingAs($user)->postJson('/api/ai/chat', ['question' => 'Explain this'])->assertStatus(503)->assertJsonPath('message', 'Thinkers AI is not configured yet.');
    }

    public function test_a_student_cannot_access_an_unenrolled_or_unpublished_course_context(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        [$ownCourse] = $this->courseContext('student-course', published: true);
        [$foreignCourse] = $this->courseContext('foreign-course', published: true);
        [$draftCourse] = $this->courseContext('draft-course', published: false);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $ownCourse->id, 'status' => 'active', 'enrolled_at' => now()]);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $draftCourse->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($student)->postJson('/api/ai/conversations', ['course_id' => $ownCourse->id])->assertCreated();
        $this->actingAs($student)->postJson('/api/ai/conversations', ['course_id' => $foreignCourse->id])->assertForbidden();
        $this->actingAs($student)->postJson('/api/ai/conversations', ['course_id' => $draftCourse->id])->assertForbidden();
    }

    public function test_a_student_cannot_access_a_foreign_or_unpublished_lesson_context(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        [$ownCourse, $ownLesson] = $this->courseContext('own-lessons', published: true);
        [, $foreignLesson] = $this->courseContext('foreign-lessons', published: true);
        [, $unpublishedLesson] = $this->courseContext('hidden-lessons', published: true, lessonPublished: false);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $ownCourse->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($student)->postJson('/api/ai/conversations', ['lesson_id' => $ownLesson->id])->assertCreated();
        $this->actingAs($student)->postJson('/api/ai/conversations', ['lesson_id' => $foreignLesson->id])->assertForbidden();
        $this->actingAs($student)->postJson('/api/ai/conversations', ['lesson_id' => $unpublishedLesson->id])->assertForbidden();
    }

    public function test_instructors_are_limited_to_their_courses_and_admins_have_full_ai_context_access(): void
    {
        $instructor = User::factory()->create(['instructor_status' => 'approved']);
        $instructor->assignRole('instructor');
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        [$ownCourse, $ownLesson] = $this->courseContext('instructor-owned', published: false, instructor: $instructor);
        [$foreignCourse, $foreignLesson] = $this->courseContext('instructor-foreign', published: false);

        $this->actingAs($instructor)->postJson('/api/ai/conversations', ['course_id' => $ownCourse->id, 'lesson_id' => $ownLesson->id])->assertCreated();
        $this->actingAs($instructor)->postJson('/api/ai/conversations', ['course_id' => $foreignCourse->id])->assertForbidden();
        $this->actingAs($instructor)->postJson('/api/ai/conversations', ['lesson_id' => $foreignLesson->id])->assertForbidden();
        $this->actingAs($admin)->postJson('/api/ai/conversations', ['course_id' => $foreignCourse->id, 'lesson_id' => $foreignLesson->id])->assertCreated();
    }

    private function textResponse(string $text): array
    {
        return ['id' => 'resp_test', 'output' => [['type' => 'message', 'role' => 'assistant', 'content' => [['type' => 'output_text', 'text' => $text]]]]];
    }

    private function courseContext(string $slug, bool $published, bool $lessonPublished = true, ?User $instructor = null): array
    {
        $instructor ??= User::factory()->create(['instructor_status' => 'approved']);
        if (! $instructor->hasRole('instructor')) {
            $instructor->assignRole('instructor');
        }
        $category = Category::create(['name' => "Category {$slug}", 'slug' => "category-{$slug}"]);
        $course = Course::create([
            'instructor_id' => $instructor->id, 'category_id' => $category->id,
            'title' => "Course {$slug}", 'slug' => $slug, 'short_description' => 'AI context course.',
            'description' => 'Protected AI course context.', 'level' => 'beginner', 'language' => 'English',
            'duration' => 60, 'price' => 0, 'currency' => 'USD', 'type' => 'free',
            'status' => $published ? 'published' : 'draft', 'published_at' => $published ? now() : null,
        ]);
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Section', 'position' => 1]);
        $lesson = Lesson::create([
            'course_section_id' => $section->id, 'title' => 'Protected Lesson', 'slug' => 'protected-lesson',
            'content_type' => 'text', 'text_content' => 'Private lesson content.', 'duration' => 10,
            'position' => 1, 'is_published' => $lessonPublished,
        ]);

        return [$course, $lesson];
    }
}
