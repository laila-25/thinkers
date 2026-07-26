<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\PlatformNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_student_instructor_and_admin_receive_their_own_supported_notifications(): void
    {
        foreach (['student', 'instructor', 'admin'] as $role) {
            $user = $this->user($role);
            $user->notify(new PlatformNotification(
                $role.'_notice', ucfirst($role).' notification', 'Safe notification content.', '/notifications', 'Open', 'course',
            ));

            $this->actingAs($user)->getJson('/api/notifications')
                ->assertOk()
                ->assertJsonCount(1, 'data')
                ->assertJsonPath('data.0.type', $role.'_notice')
                ->assertJsonPath('meta.unread_count', 1);
        }
    }

    public function test_user_can_mark_one_and_all_notifications_as_read(): void
    {
        $user = $this->user('student');
        $first = $this->notification($user, 'quiz_graded');
        $this->notification($user, 'new_lesson');

        $this->actingAs($user)->patchJson("/api/notifications/{$first->id}/read")
            ->assertOk()->assertJsonPath('meta.unread_count', 1);
        $this->assertNotNull($first->fresh()->read_at);

        $this->actingAs($user)->patchJson('/api/notifications/read-all')
            ->assertOk()->assertJsonPath('meta.unread_count', 0);
        $this->assertSame(0, $user->unreadNotifications()->count());
    }

    public function test_notification_ownership_is_enforced_without_leaking_foreign_data(): void
    {
        $owner = $this->user('student');
        $intruder = $this->user('student');
        $notification = $this->notification($owner, 'certificate_issued');

        $this->actingAs($intruder)->patchJson("/api/notifications/{$notification->id}/read")->assertNotFound();
        $this->actingAs($intruder)->getJson('/api/notifications')
            ->assertOk()->assertJsonCount(0, 'data')->assertJsonMissing(['id' => $notification->id]);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/notifications')->assertUnauthorized();
    }

    public function test_notifications_use_stable_cursor_pagination(): void
    {
        $user = $this->user('student');
        foreach (range(1, 12) as $number) {
            $this->notification($user, "notice_{$number}");
        }

        $first = $this->actingAs($user)->getJson('/api/notifications?per_page=5')
            ->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('meta.has_more', true);
        $cursor = urlencode($first->json('meta.next_cursor'));
        $second = $this->actingAs($user)->getJson("/api/notifications?per_page=5&cursor={$cursor}")
            ->assertOk()->assertJsonCount(5, 'data');

        $this->assertEmpty(array_intersect(
            collect($first->json('data'))->pluck('id')->all(),
            collect($second->json('data'))->pluck('id')->all(),
        ));
    }

    public function test_user_can_manage_only_their_notification_preferences(): void
    {
        $user = $this->user('instructor');
        $payload = ['course_updates' => true, 'learning_activity' => false, 'commerce' => true, 'platform_alerts' => false];

        $this->actingAs($user)->patchJson('/api/notification-settings', $payload)
            ->assertOk()->assertExactJson(['data' => $payload]);
        $this->assertSame($payload, $user->fresh()->notification_preferences);
    }

    private function user(string $role): User
    {
        $user = User::factory()->create(['email_verified_at' => now(), 'instructor_status' => $role === 'instructor' ? 'approved' : null]);
        $user->assignRole($role);

        return $user;
    }

    private function notification(User $user, string $type)
    {
        return $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => PlatformNotification::class,
            'data' => ['type' => $type, 'title' => Str::headline($type), 'message' => 'Safe message.', 'destination' => '/notifications'],
        ]);
    }
}
