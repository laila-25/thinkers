<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->index(['status', 'published_at'], 'courses_status_published_at_index');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->index('created_at', 'users_created_at_index');
            $table->index(['instructor_status', 'created_at'], 'users_instructor_status_created_at_index');
        });
        Schema::table('enrollments', function (Blueprint $table) {
            $table->index('created_at', 'enrollments_created_at_index');
        });
        Schema::table('ai_messages', function (Blueprint $table) {
            $table->index(['role', 'created_at'], 'ai_messages_role_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('courses', fn (Blueprint $table) => $table->dropIndex('courses_status_published_at_index'));
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_created_at_index');
            $table->dropIndex('users_instructor_status_created_at_index');
        });
        Schema::table('enrollments', fn (Blueprint $table) => $table->dropIndex('enrollments_created_at_index'));
        Schema::table('ai_messages', fn (Blueprint $table) => $table->dropIndex('ai_messages_role_created_at_index'));
    }
};
