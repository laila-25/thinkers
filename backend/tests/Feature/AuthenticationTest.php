<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_a_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'USER@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.email', 'user@example.com');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'user@example.com']);
    }

    public function test_a_user_can_login_and_access_the_protected_user_endpoint(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password'),
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('id', $user->id);
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'incorrect-password',
        ])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_an_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('password'),
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $this->postJson('/api/logout')->assertOk();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_a_guest_cannot_access_the_protected_user_endpoint(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
