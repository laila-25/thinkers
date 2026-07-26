<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PerformanceCache;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_access_dashboard_management_apis(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure(['data' => ['overview', 'charts', 'attention']]);
        $this->actingAs($admin)->getJson('/api/admin/users')->assertOk();
        $this->actingAs($admin)->getJson('/api/admin/courses')->assertOk();
        $this->actingAs($admin)->getJson('/api/admin/ai-usage')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total_requests', 'total_tokens', 'active_users', 'trend', 'top_users']]);
    }

    public function test_student_cannot_access_admin_apis(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->assertAdminEndpointsForbiddenFor($student);
    }

    public function test_instructor_cannot_access_admin_apis(): void
    {
        $instructor = User::factory()->create(['instructor_status' => 'approved']);
        $instructor->assignRole('instructor');

        $this->assertAdminEndpointsForbiddenFor($instructor);
    }

    public function test_admin_dashboard_requires_authentication_and_verified_email(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();

        $admin = User::factory()->unverified()->create();
        $admin->assignRole('admin');
        $this->actingAs($admin)->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_admin_dashboard_is_cached_for_five_minutes_and_invalidated_when_a_user_is_created(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $initial = $this->actingAs($admin)->getJson('/api/admin/dashboard')
            ->assertOk()
            ->json('data.overview.total_users');
        $this->assertTrue(Cache::has(PerformanceCache::ADMIN_DASHBOARD));

        DB::table('users')->insert([
            'name' => 'Cache bypass user',
            'email' => 'cache-bypass@example.test',
            'email_verified_at' => now(),
            'password' => 'not-used',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($admin)->getJson('/api/admin/dashboard')
            ->assertJsonPath('data.overview.total_users', $initial);

        User::factory()->create();
        $this->assertFalse(Cache::has(PerformanceCache::ADMIN_DASHBOARD));
        $this->actingAs($admin)->getJson('/api/admin/dashboard')
            ->assertJsonPath('data.overview.total_users', $initial + 2);
    }

    public function test_dashboard_chart_series_are_aggregated_and_keep_the_existing_shape(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        User::factory()->create(['created_at' => now()->subMonths(2), 'updated_at' => now()->subMonths(2)]);
        User::factory()->count(2)->create(['created_at' => now(), 'updated_at' => now()]);

        $series = $this->actingAs($admin)->getJson('/api/admin/dashboard')
            ->assertOk()
            ->json('data.charts.user_growth');

        $this->assertCount(6, $series);
        $this->assertSame(now()->format('M'), $series[5]['label']);
        $this->assertGreaterThanOrEqual(3, $series[5]['value']);
    }

    public function test_admin_can_grant_and_revoke_admin_access(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$student->id}/admin-access", ['is_admin' => true])
            ->assertOk()
            ->assertJsonPath('data.roles', fn (array $roles) => in_array('admin', $roles, true));
        $this->assertTrue($student->fresh()->hasRole('admin'));

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$student->id}/admin-access", ['is_admin' => false])
            ->assertOk();
        $this->assertFalse($student->fresh()->hasRole('admin'));
        $this->assertTrue($student->fresh()->hasRole('student'));
    }

    public function test_non_admin_cannot_change_admin_access(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        $target = User::factory()->create();
        $target->assignRole('student');

        $this->actingAs($student)
            ->patchJson("/api/admin/users/{$target->id}/admin-access", ['is_admin' => true])
            ->assertForbidden();
        $this->assertFalse($target->fresh()->hasRole('admin'));
    }

    public function test_admin_cannot_change_their_own_admin_access(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$admin->id}/admin-access", ['is_admin' => false])
            ->assertUnprocessable();
        $this->assertTrue($admin->fresh()->hasRole('admin'));
    }

    private function assertAdminEndpointsForbiddenFor(User $user): void
    {
        foreach (['/api/admin/dashboard', '/api/admin/users', '/api/admin/courses', '/api/admin/ai-usage'] as $endpoint) {
            $this->actingAs($user)->getJson($endpoint)->assertForbidden();
        }
    }
}
