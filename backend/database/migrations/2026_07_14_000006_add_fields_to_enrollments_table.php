<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->after('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('last_accessed_lesson_id')->nullable()->after('course_id')->constrained('lessons')->nullOnDelete();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active')->after('last_accessed_lesson_id');
            $table->timestamp('enrolled_at')->useCurrent()->after('status');
            $table->timestamp('completed_at')->nullable()->after('enrolled_at');
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            $table->unique(['user_id', 'course_id']);
            $table->index(['user_id', 'status']);
            $table->index(['course_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['course_id']);
            $table->dropForeign(['last_accessed_lesson_id']);
            $table->dropUnique(['user_id', 'course_id']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['course_id', 'status']);
            $table->dropColumn(['user_id', 'course_id', 'last_accessed_lesson_id', 'status', 'enrolled_at', 'completed_at', 'cancelled_at']);
        });
    }
};
