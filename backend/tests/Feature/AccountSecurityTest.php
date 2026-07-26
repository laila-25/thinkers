<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\QueuedResetPassword;
use App\Notifications\QueuedVerifyEmail;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AccountSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_registration_sends_an_email_verification_notification(): void
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'name' => 'Unverified User',
            'email' => 'unverified@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertCreated();

        $user = User::where('email', 'unverified@example.com')->firstOrFail();
        $this->assertFalse($user->hasVerifiedEmail());
        Notification::assertSentTo($user, QueuedVerifyEmail::class);
    }

    public function test_email_can_be_verified_with_a_valid_signed_link(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->getJson($this->verificationUrl($user))
            ->assertOk()
            ->assertJsonPath('message', 'Email address verified successfully.');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());

        $this->actingAs($user->fresh())->getJson($this->verificationUrl($user->fresh()))
            ->assertOk()
            ->assertJsonPath('message', 'Email address is already verified.');
    }

    public function test_an_invalid_verification_link_is_rejected(): void
    {
        $user = User::factory()->unverified()->create();
        $url = $this->verificationUrl($user).'tampered';

        $this->actingAs($user)->getJson($url)->assertForbidden();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_an_unverified_user_can_resend_the_verification_notification(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->postJson('/api/email/verification-notification')
            ->assertAccepted()
            ->assertJsonPath('message', 'Verification email sent.');

        Notification::assertSentTo($user, QueuedVerifyEmail::class);
    }

    public function test_a_verified_user_does_not_receive_duplicate_verification_notifications(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('message', 'Email address is already verified.');

        Notification::assertNothingSent();
    }

    public function test_forgot_password_has_a_generic_response_and_sends_a_reset_link(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $expected = 'If an account exists for that email, a password reset link has been sent.';
        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk()->assertJsonPath('message', $expected);
        $this->postJson('/api/forgot-password', ['email' => 'missing@example.com'])->assertOk()->assertJsonPath('message', $expected);

        Notification::assertSentTo($user, QueuedResetPassword::class);
    }

    public function test_a_password_can_be_reset_with_a_valid_token_and_the_token_cannot_be_reused(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $token = $this->sendResetLinkAndCaptureToken($user);
        $payload = [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ];

        $this->postJson('/api/reset-password', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Password reset successfully.');

        $this->assertTrue(Hash::check('NewPassword1!', $user->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->postJson('/api/reset-password', $payload)->assertUnprocessable();
    }

    public function test_an_invalid_password_reset_token_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'invalid-token',
            'password' => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ])->assertUnprocessable()->assertJsonPath('errors.token.0', 'The password reset token is invalid or has expired.');
    }

    public function test_an_expired_password_reset_token_is_rejected(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $token = $this->sendResetLinkAndCaptureToken($user);
        DB::table('password_reset_tokens')->where('email', $user->email)->update(['created_at' => now()->subMinutes(61)]);

        $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ])->assertUnprocessable();

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_unverified_users_cannot_access_verified_business_endpoints(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->postJson('/api/ai/summarize', ['content' => 'Sensitive content.'])->assertForbidden();
        $this->actingAs($user)->getJson('/api/user')->assertOk();
    }

    private function verificationUrl(User $user): string
    {
        return URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
        ], absolute: false);
    }

    private function sendResetLinkAndCaptureToken(User $user): string
    {
        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        $token = null;
        Notification::assertSentTo($user, QueuedResetPassword::class, function (QueuedResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });

        return $token;
    }
}
