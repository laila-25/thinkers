<?php

namespace Tests\Feature;

use App\Jobs\GenerateCertificatePdf;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use App\Services\CertificateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CertificateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (['student', 'instructor', 'admin'] as $role) {
            Role::findOrCreate($role, 'web');
        }
    }

    public function test_course_completion_creates_one_certificate_and_dispatches_pdf_generation(): void
    {
        Queue::fake();
        [$student, $enrollment, $lessons] = $this->learningSetup(2);

        foreach ($lessons as $lesson) {
            $this->actingAs($student)->putJson("/api/enrollments/{$enrollment->id}/lessons/{$lesson->id}/progress", ['status' => 'completed'])->assertOk();
        }

        $this->assertDatabaseCount('certificates', 1);
        $certificate = Certificate::firstOrFail();
        $this->assertSame('pending', $certificate->status);
        $this->assertSame(64, strlen($certificate->verification_code));
        Queue::assertPushed(GenerateCertificatePdf::class, 1);

        app(CertificateService::class)->issueForCompletedEnrollment($enrollment->fresh());
        $this->assertDatabaseCount('certificates', 1);
    }

    public function test_certificate_is_not_created_before_every_required_lesson_is_completed(): void
    {
        Queue::fake();
        [$student, $enrollment, $lessons] = $this->learningSetup(2);

        $this->actingAs($student)->putJson("/api/enrollments/{$enrollment->id}/lessons/{$lessons->first()->id}/progress", [
            'status' => 'completed',
        ])->assertOk()->assertJsonPath('data.status', 'active');

        $this->assertDatabaseCount('certificates', 0);
        Queue::assertNotPushed(GenerateCertificatePdf::class);
    }

    public function test_students_cannot_access_another_students_certificate(): void
    {
        [$owner, $enrollment] = $this->learningSetup(1);
        $other = User::factory()->create();
        $other->assignRole('student');
        $certificate = $this->certificate($owner, $enrollment->course);

        $this->actingAs($other)->getJson("/api/certificates/{$certificate->id}")->assertForbidden();
        $this->actingAs($other)->get("/api/certificates/{$certificate->id}/download")->assertForbidden();
    }

    public function test_admin_can_view_download_and_revoke_certificates(): void
    {
        Storage::fake('certificates');
        [$student, $enrollment] = $this->learningSetup(1);
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $certificate = $this->certificate($student, $enrollment->course);
        Storage::disk('certificates')->put($certificate->pdf_path, 'pdf-content');

        $this->actingAs($admin)->getJson('/api/certificates')
            ->assertOk()
            ->assertJsonPath('data.0.id', $certificate->id);
        $this->actingAs($admin)->getJson("/api/certificates/{$certificate->id}")->assertOk();
        $this->actingAs($admin)->get("/api/certificates/{$certificate->id}/download")->assertOk();
        $this->actingAs($admin)->patchJson("/api/certificates/{$certificate->id}/revoke")
            ->assertOk()
            ->assertJsonPath('data.status', 'revoked');
    }

    public function test_public_verification_returns_only_safe_certificate_data(): void
    {
        [$student, $enrollment] = $this->learningSetup(1);
        $certificate = $this->certificate($student, $enrollment->course);

        $this->getJson('/api/certificates/verify/'.$certificate->verification_code)
            ->assertOk()
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.owner_name', $student->name)
            ->assertJsonMissing(['email' => $student->email]);
    }

    public function test_invalid_verification_code_is_rejected(): void
    {
        $this->getJson('/api/certificates/verify/'.str_repeat('x', 64))->assertNotFound();
    }

    public function test_pdf_job_writes_to_private_certificate_disk(): void
    {
        Storage::fake('certificates');
        [$student, $enrollment] = $this->learningSetup(1);
        $certificate = $this->certificate($student, $enrollment->course, 'pending', null);

        (new GenerateCertificatePdf($certificate->id))->handle();

        $certificate->refresh();
        $this->assertSame('issued', $certificate->status);
        Storage::disk('certificates')->assertExists($certificate->pdf_path);
    }

    private function certificate(User $student, Course $course, string $status = 'issued', ?string $path = 'certificate.pdf'): Certificate
    {
        return Certificate::create([
            'user_id' => $student->id, 'course_id' => $course->id,
            'certificate_number' => 'THK-2026-'.strtoupper(fake()->unique()->bothify('????????')),
            'verification_code' => fake()->unique()->regexify('[A-Za-z0-9]{64}'),
            'issued_at' => now(), 'pdf_path' => $path, 'status' => $status,
        ]);
    }

    private function learningSetup(int $lessonCount): array
    {
        $student = User::factory()->create(['email_verified_at' => now()]);
        $student->assignRole('student');
        $instructor = User::factory()->create(['instructor_status' => 'approved']);
        $instructor->assignRole('instructor');
        $category = Category::create(['name' => fake()->unique()->word(), 'slug' => fake()->unique()->slug()]);
        $course = Course::create([
            'instructor_id' => $instructor->id, 'category_id' => $category->id, 'title' => 'Certificate Course',
            'slug' => fake()->unique()->slug(), 'short_description' => 'Certificate course.', 'description' => 'Certificate course.',
            'level' => 'beginner', 'language' => 'English', 'duration' => 60, 'price' => 0,
            'currency' => 'USD', 'type' => 'free', 'status' => 'published', 'published_at' => now(),
        ]);
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'Required lessons', 'position' => 1]);
        $lessons = collect(range(1, $lessonCount))->map(fn (int $position) => Lesson::create([
            'course_section_id' => $section->id, 'title' => "Lesson {$position}", 'slug' => fake()->unique()->slug(),
            'content_type' => 'text', 'duration' => 10, 'position' => $position, 'is_published' => true,
        ]));
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        return [$student, $enrollment, $lessons];
    }
}
