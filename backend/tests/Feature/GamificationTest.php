<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\LearnerProfile;
use App\Models\Lesson;
use App\Models\User;
use App\Services\GamificationService;
use Carbon\CarbonImmutable;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GamificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_lesson_and_course_xp_are_transactional_and_cannot_be_farmed(): void
    {
        $this->getJson('/api/gamification')->assertUnauthorized();

        [$student, $course, $enrollment, $lessons] = $this->learningSetup(2);

        $url = "/api/enrollments/{$enrollment->id}/lessons/{$lessons[0]->id}/progress";
        $this->actingAs($student)->putJson($url, ['status' => 'completed'])->assertOk();
        $this->actingAs($student)->putJson($url, ['status' => 'completed'])->assertOk();
        $this->assertSame(35, LearnerProfile::where('user_id', $student->id)->value('total_xp'));
        $this->assertDatabaseCount('xp_transactions', 2);

        $this->actingAs($student)
            ->putJson("/api/enrollments/{$enrollment->id}/lessons/{$lessons[1]->id}/progress", ['status' => 'completed'])
            ->assertOk();

        $this->assertSame(260, LearnerProfile::where('user_id', $student->id)->value('total_xp'));
        $this->assertDatabaseHas('achievement_user', ['user_id' => $student->id]);
        $this->actingAs($student)->getJson('/api/gamification')
            ->assertOk()
            ->assertJsonPath('data.level.name', 'Explorer')
            ->assertJsonPath('data.level.next.requirement', 300);
    }

    public function test_daily_activity_uses_learner_timezone_and_unlocks_streak_reward_once(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        LearnerProfile::create(['user_id' => $student->id, 'timezone' => 'Asia/Amman']);
        $service = app(GamificationService::class);

        foreach (range(0, 6) as $offset) {
            $service->recordActivity($student, CarbonImmutable::parse('2026-07-01 12:00:00', 'Asia/Amman')->addDays($offset));
        }
        $service->recordActivity($student, CarbonImmutable::parse('2026-07-07 18:00:00', 'Asia/Amman'));

        $profile = LearnerProfile::where('user_id', $student->id)->firstOrFail();
        $this->assertSame(7, $profile->current_streak);
        $this->assertSame(7, $profile->longest_streak);
        $this->assertSame(120, $profile->total_xp);
        $this->assertDatabaseHas('achievement_user', ['user_id' => $student->id]);
        $this->assertDatabaseCount('learning_activities', 7);
    }

    public function test_quiz_rewards_are_unique_and_xp_cannot_be_set_from_the_api(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        $service = app(GamificationService::class);
        $service->recordQuizPass($student, 10);
        $service->recordQuizPass($student, 10);

        $this->assertSame(85, LearnerProfile::where('user_id', $student->id)->value('total_xp'));
        $this->actingAs($student)->patchJson('/api/gamification/settings', [
            'total_xp' => 999999,
            'timezone' => 'Asia/Amman',
        ])->assertOk()->assertJsonPath('data.total_xp', 85);
    }

    public function test_leaderboard_is_opt_in_and_does_not_expose_private_learners(): void
    {
        $viewer = User::factory()->create();
        $viewer->assignRole('student');
        $public = User::factory()->create(['name' => 'Public Learner']);
        $public->assignRole('student');
        $private = User::factory()->create(['name' => 'Private Learner']);
        $private->assignRole('student');
        LearnerProfile::create(['user_id' => $public->id, 'total_xp' => 500, 'leaderboard_visible' => true]);
        LearnerProfile::create(['user_id' => $private->id, 'total_xp' => 900, 'leaderboard_visible' => false]);

        $this->actingAs($viewer)->getJson('/api/leaderboard')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Public Learner')
            ->assertJsonMissing(['Private Learner']);
    }

    private function learningSetup(int $lessonCount): array
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        $instructor = User::factory()->create(['instructor_status' => 'approved']);
        $instructor->assignRole('instructor');
        $category = Category::create(['name' => 'Gamification', 'slug' => 'gamification']);
        $course = Course::create([
            'instructor_id' => $instructor->id, 'category_id' => $category->id, 'title' => 'XP Course',
            'slug' => 'xp-course', 'short_description' => 'Earn XP safely.', 'description' => 'XP.',
            'level' => 'beginner', 'language' => 'English', 'duration' => 60, 'price' => 0,
            'currency' => 'USD', 'type' => 'free', 'status' => 'published', 'published_at' => now(),
        ]);
        $section = CourseSection::create(['course_id' => $course->id, 'title' => 'XP', 'position' => 1]);
        $lessons = collect(range(1, $lessonCount))->map(fn (int $position) => Lesson::create([
            'course_section_id' => $section->id, 'title' => "Lesson {$position}", 'slug' => "xp-lesson-{$position}",
            'content_type' => 'text', 'duration' => 10, 'position' => $position, 'is_published' => true,
        ]));
        $enrollment = Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        return [$student, $course, $enrollment, $lessons];
    }
}
