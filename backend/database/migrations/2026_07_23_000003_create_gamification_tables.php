<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learner_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('total_xp')->default(0)->index();
            $table->unsignedInteger('current_streak')->default(0);
            $table->unsignedInteger('longest_streak')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->string('timezone', 64)->default('UTC');
            $table->boolean('leaderboard_visible')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('xp_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('points');
            $table->string('reason', 50);
            $table->string('reward_key', 150);
            $table->json('metadata')->nullable();
            $table->timestamp('awarded_at')->useCurrent();
            $table->unique(['user_id', 'reward_key']);
            $table->index(['user_id', 'awarded_at']);
        });

        Schema::create('learning_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('activity_date');
            $table->unsignedInteger('events_count')->default(1);
            $table->timestamps();
            $table->unique(['user_id', 'activity_date']);
        });

        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('description');
            $table->string('icon', 50);
            $table->timestamps();
        });

        Schema::create('achievement_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('achievement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('unlocked_at')->useCurrent();
            $table->unique(['achievement_id', 'user_id']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        DB::table('achievements')->insert([
            ['key' => 'first_lesson', 'name' => 'First Lesson Completed', 'description' => 'Complete your first lesson.', 'icon' => 'book-check', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'first_course', 'name' => 'First Course Completed', 'description' => 'Complete your first course.', 'icon' => 'graduation-cap', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'seven_day_streak', 'name' => '7 Day Streak', 'description' => 'Learn for seven consecutive days.', 'icon' => 'flame', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'quiz_master', 'name' => 'Quiz Master', 'description' => 'Pass five different quizzes.', 'icon' => 'trophy', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'ai_explorer', 'name' => 'AI Explorer', 'description' => 'Learn with the Thinkers AI Tutor.', 'icon' => 'sparkles', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'course_collector', 'name' => 'Course Collector', 'description' => 'Enroll in three courses.', 'icon' => 'library', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('achievement_user');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('learning_activities');
        Schema::dropIfExists('xp_transactions');
        Schema::dropIfExists('learner_profiles');
    }
};
