<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class CourseContentDeliveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        Storage::fake('course_media');
    }

    public function test_only_the_owner_can_manage_content_and_rich_text_is_sanitized(): void
    {
        [$course, $owner, $lesson] = $this->courseWithLesson('text');
        $other = User::factory()->create(['instructor_status' => 'approved']);
        $other->assignRole('instructor');

        $this->actingAs($other)->putJson("/api/manage/lessons/{$lesson->id}/content", ['content' => '<p>Denied</p>'])->assertForbidden();
        $this->actingAs($owner)->putJson("/api/manage/lessons/{$lesson->id}/content", [
            'content' => '<p onclick="steal()">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">Link</a>',
        ])->assertOk();

        $content = $lesson->fresh()->text_content;
        $this->assertStringContainsString('<p>Safe</p>', $content);
        $this->assertStringNotContainsString('script', $content);
        $this->assertStringNotContainsString('onclick', $content);
        $this->assertStringNotContainsString('javascript:', $content);
    }

    public function test_video_and_resource_uploads_are_private_and_paths_are_not_exposed(): void
    {
        [, $owner, $lesson] = $this->courseWithLesson('video');
        $response = $this->actingAs($owner)->post("/api/manage/lessons/{$lesson->id}/video", [
            'video' => UploadedFile::fake()->create('lesson.mp4', 100, 'video/mp4'),
        ])->assertOk()->assertJsonMissingPath('data.video.path')->assertJsonPath('data.video.processing_status', 'ready');

        $this->actingAs($owner)->post("/api/manage/lessons/{$lesson->id}/attachments", [
            'file' => UploadedFile::fake()->create('notes.pdf', 50, 'application/pdf'),
        ])->assertOk()->assertJsonMissingPath('data.attachments.0.path');

        Storage::disk('course_media')->assertExists($lesson->fresh()->video->path);
        $this->assertNotEmpty($response->json('data.video.stream_url'));
        $this->assertSame(
            "/api/learning/lessons/{$lesson->id}/video",
            $response->json('data.video.stream_url')
        );
    }

    public function test_laravel_accepts_the_approved_video_size_boundary(): void
    {
        $rules = ['video' => ['required', 'file', 'max:524288', 'mimes:mp4,webm,mov', 'mimetypes:video/mp4,video/webm,video/quicktime']];
        $atLimit = UploadedFile::fake()->create('lesson.mp4', 524288, 'video/mp4');
        $overLimit = UploadedFile::fake()->create('lesson.mp4', 524289, 'video/mp4');

        $this->assertTrue(Validator::make(['video' => $atLimit], $rules)->passes());
        $this->assertTrue(Validator::make(['video' => $overLimit], $rules)->fails());
    }

    public function test_only_enrolled_students_or_public_preview_users_can_consume_lessons(): void
    {
        [$course, , $lesson] = $this->courseWithLesson('text', published: true);
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($student)->getJson("/api/learning/lessons/{$lesson->id}")->assertForbidden();
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $this->actingAs($student)->getJson("/api/learning/lessons/{$lesson->id}")->assertOk();
        $lesson->update(['is_published' => false]);
        $this->actingAs($student)->getJson("/api/learning/lessons/{$lesson->id}")->assertForbidden();
        $lesson->update(['is_published' => true]);
        $enrollment->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        $this->actingAs($student)->getJson("/api/learning/lessons/{$lesson->id}")->assertForbidden();

        $this->getJson("/api/preview/lessons/{$lesson->id}")->assertNotFound();
        $lesson->update(['is_preview' => true]);
        $this->getJson("/api/preview/lessons/{$lesson->id}")->assertOk();
    }

    public function test_video_delivery_supports_byte_ranges_without_weakening_authorization(): void
    {
        [$course, , $lesson] = $this->courseWithLesson('video', published: true);
        $this->attachReadyVideo($lesson);
        $lesson->update(['is_preview' => true]);

        $this->withHeader('Range', 'bytes=0-1023')
            ->get("/api/preview/lessons/{$lesson->id}/video")
            ->assertStatus(206)
            ->assertHeader('accept-ranges', 'bytes')
            ->assertHeader('content-range', 'bytes 0-1023/4096')
            ->assertHeader('content-length', '1024');

        $lesson->update(['is_preview' => false]);
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($student)
            ->withHeader('Range', 'bytes=0-1023')
            ->get("/api/learning/lessons/{$lesson->id}/video")
            ->assertForbidden();

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->actingAs($student)
            ->withHeader('Range', 'bytes=0-1023')
            ->get("/api/learning/lessons/{$lesson->id}/video")
            ->assertStatus(206)
            ->assertHeader('content-range', 'bytes 0-1023/4096');
    }

    private function attachReadyVideo(Lesson $lesson): void
    {
        $contents = str_repeat('0', 4096);
        $path = "courses/{$lesson->section->course_id}/lessons/{$lesson->id}/videos/lesson.mp4";
        Storage::disk('course_media')->put($path, $contents);
        $lesson->video()->create([
            'disk' => 'course_media',
            'path' => $path,
            'original_name' => 'lesson.mp4',
            'mime_type' => 'video/mp4',
            'file_size' => strlen($contents),
            'checksum' => hash('sha256', $contents),
            'provider' => 'local',
            'processing_status' => 'ready',
            'processed_at' => now(),
        ]);
    }

    private function courseWithLesson(string $type, bool $published = false): array
    {
        $owner = User::factory()->create(['instructor_status' => 'approved']);
        $owner->assignRole('instructor');
        $category = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        $course = Course::create([
            'instructor_id' => $owner->id, 'category_id' => $category->id,
            'title' => 'Secure Course', 'slug' => 'secure-course', 'short_description' => 'Secure lessons.',
            'description' => 'Course description.', 'level' => 'beginner', 'language' => 'English',
            'duration' => 60, 'price' => 0, 'currency' => 'USD', 'type' => 'free',
            'status' => $published ? 'published' : 'draft', 'published_at' => $published ? now() : null,
        ]);
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Section', 'position' => 1]);
        $lesson = Lesson::create([
            'course_section_id' => $section->id, 'title' => 'Lesson', 'slug' => 'lesson',
            'content_type' => $type, 'duration' => 10, 'position' => 1, 'is_published' => $published,
        ]);

        return [$course, $owner, $lesson];
    }
}
