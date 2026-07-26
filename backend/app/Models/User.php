<?php

namespace App\Models;

use App\Notifications\QueuedResetPassword;
use App\Notifications\QueuedVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'instructor_status',
        'notification_preferences',
        'instructor_approved_at',
        'instructor_approved_by',
        'instructor_rejection_reason',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'instructor_approved_at' => 'datetime',
            'notification_preferences' => 'array',
        ];
    }

    public function isApprovedInstructor(): bool
    {
        return $this->hasRole('instructor')
            && $this->instructor_status === 'approved';
    }

    public function allowsNotification(string $preference): bool
    {
        return ($this->notification_preferences[$preference] ?? true) === true;
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new QueuedVerifyEmail);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new QueuedResetPassword($token));
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function aiConversations(): HasMany
    {
        return $this->hasMany(AIConversation::class);
    }

    public function learnerProfile(): HasOne
    {
        return $this->hasOne(LearnerProfile::class);
    }

    public function xpTransactions(): HasMany
    {
        return $this->hasMany(XpTransaction::class);
    }

    public function learningActivities(): HasMany
    {
        return $this->hasMany(LearningActivity::class);
    }

    public function achievements(): BelongsToMany
    {
        return $this->belongsToMany(Achievement::class)->withPivot('unlocked_at');
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function instructorEarnings(): HasMany
    {
        return $this->hasMany(InstructorEarning::class, 'instructor_id');
    }

    public function instructorApprover(): BelongsTo
    {
        return $this->belongsTo(self::class, 'instructor_approved_by');
    }
}
