<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_view_activity_and_operational_notifications(): void
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');
        ActivityLog::create([
            'actor_id' => $admin->id,
            'action' => 'admin.tested',
            'metadata' => ['safe' => true],
        ]);

        $this->actingAs($admin)->getJson('/api/admin/activity')
            ->assertOk()
            ->assertJsonPath('data.0.action', 'admin.tested')
            ->assertJsonPath('data.0.actor.name', $admin->name);
        $this->actingAs($admin)->getJson('/api/admin/notifications')->assertOk();
    }

    public function test_non_admin_cannot_view_admin_operations(): void
    {
        $student = User::factory()->create(['email_verified_at' => now()]);
        $student->assignRole('student');

        $this->actingAs($student)->getJson('/api/admin/activity')->assertForbidden();
        $this->actingAs($student)->getJson('/api/admin/notifications')->assertForbidden();
        $this->actingAs($student)->getJson('/api/admin/revenue')->assertForbidden();
    }
}
