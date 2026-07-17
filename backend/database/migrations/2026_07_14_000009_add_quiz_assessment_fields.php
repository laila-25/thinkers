<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->string('title')->after('lesson_id');
            $table->text('description')->nullable()->after('title');
            $table->unsignedTinyInteger('passing_score_percentage')->default(70)->after('description');
            $table->unsignedSmallInteger('maximum_attempts')->default(1)->after('passing_score_percentage');
            $table->unsignedSmallInteger('time_limit_minutes')->nullable()->after('maximum_attempts');
            $table->enum('status', ['draft', 'published'])->default('draft')->after('time_limit_minutes');
            $table->index(['status', 'created_at']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('quiz_id')->after('id')->constrained()->cascadeOnDelete();
            $table->text('question_text')->after('quiz_id');
            $table->enum('question_type', ['multiple_choice', 'true_false'])->after('question_text');
            $table->decimal('points', 8, 2)->default(1)->after('question_type');
            $table->unsignedInteger('position')->after('points');
            $table->unique(['quiz_id', 'position']);
        });

        Schema::table('answers', function (Blueprint $table) {
            $table->foreignId('question_id')->after('id')->constrained()->cascadeOnDelete();
            $table->text('option_text')->after('question_id');
            $table->boolean('is_correct')->default(false)->after('option_text');
            $table->unsignedInteger('position')->after('is_correct');
            $table->unique(['question_id', 'position']);
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('enrollment_id')->after('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->after('enrollment_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('attempt_number')->after('quiz_id');
            $table->enum('status', ['in_progress', 'submitted', 'expired'])->default('in_progress')->after('attempt_number');
            $table->decimal('score', 10, 2)->default(0)->after('status');
            $table->decimal('maximum_score', 10, 2)->default(0)->after('score');
            $table->decimal('percentage', 5, 2)->default(0)->after('maximum_score');
            $table->boolean('passed')->default(false)->after('percentage');
            $table->timestamp('started_at')->useCurrent()->after('passed');
            $table->timestamp('completed_at')->nullable()->after('started_at');
            $table->unique(['quiz_id', 'user_id', 'attempt_number']);
            $table->index(['enrollment_id', 'status']);
            $table->index(['quiz_id', 'status']);
        });

        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->restrictOnDelete();
            $table->foreignId('answer_id')->nullable()->constrained('answers')->restrictOnDelete();
            $table->boolean('is_correct')->default(false);
            $table->decimal('awarded_points', 8, 2)->default(0);
            $table->timestamps();
            $table->unique(['quiz_attempt_id', 'question_id']);
            $table->index(['quiz_attempt_id', 'is_correct']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempt_answers');
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['enrollment_id']);
            $table->dropForeign(['quiz_id']);
            $table->dropUnique(['quiz_id', 'user_id', 'attempt_number']);
            $table->dropIndex(['enrollment_id', 'status']);
            $table->dropIndex(['quiz_id', 'status']);
            $table->dropColumn(['user_id', 'enrollment_id', 'quiz_id', 'attempt_number', 'status', 'score', 'maximum_score', 'percentage', 'passed', 'started_at', 'completed_at']);
        });
        Schema::table('answers', function (Blueprint $table) {
            $table->dropForeign(['question_id']);
            $table->dropUnique(['question_id', 'position']);
            $table->dropColumn(['question_id', 'option_text', 'is_correct', 'position']);
        });
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['quiz_id']);
            $table->dropUnique(['quiz_id', 'position']);
            $table->dropColumn(['quiz_id', 'question_text', 'question_type', 'points', 'position']);
        });
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropColumn(['title', 'description', 'passing_score_percentage', 'maximum_attempts', 'time_limit_minutes', 'status']);
        });
    }
};
