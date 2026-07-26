<?php

namespace Database\Seeders;

use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\PlatformNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class E2ETestSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DemoCatalogSeeder::class);

        $student = User::where('email', 'student1@thinkers.demo')->firstOrFail();
        $applicant = User::updateOrCreate(
            ['email' => 'pending.instructor@thinkers.demo'],
            [
                'name' => 'Pending Instructor',
                'password' => 'Thinkers123!',
                'email_verified_at' => now(),
                'instructor_status' => 'pending',
            ],
        );
        $applicant->syncRoles(['student']);
        $enrollment = Enrollment::where('user_id', $student->id)->with('course')->firstOrFail();

        Certificate::updateOrCreate(
            ['user_id' => $student->id, 'course_id' => $enrollment->course_id],
            [
                'certificate_number' => 'THINKERS-E2E-0001',
                'verification_code' => 'e2e-certificate-verification-code-0001',
                'issued_at' => now()->subDay(),
                'status' => 'issued',
            ],
        );

        foreach ([
            [$student, 'quiz_graded', 'Quiz graded', 'Your latest quiz has been graded.'],
            [$student, 'new_lesson', 'New lesson available', 'A new lesson is ready in your course.'],
            [User::where('email', 'lina.haddad@thinkers.demo')->firstOrFail(), 'new_enrollment', 'New enrollment', 'A learner joined your course.'],
            [User::role('admin')->firstOrFail(), 'security_event', 'Security event reviewed', 'A protected route check was recorded.'],
        ] as [$recipient, $type, $title, $message]) {
            $recipient->notifications()->create([
                'id' => (string) Str::uuid(),
                'type' => PlatformNotification::class,
                'data' => compact('type', 'title', 'message') + ['destination' => '/notifications', 'icon' => 'course'],
            ]);
        }
    }
}
