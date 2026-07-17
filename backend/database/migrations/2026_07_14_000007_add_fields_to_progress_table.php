<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            $table->foreignId('enrollment_id')->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->after('enrollment_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started')->after('lesson_id');
            $table->unsignedTinyInteger('completion_percentage')->default(0)->after('status');
            $table->unsignedInteger('playback_position')->default(0)->comment('Playback position in seconds')->after('completion_percentage');
            $table->timestamp('started_at')->nullable()->after('playback_position');
            $table->timestamp('last_accessed_at')->nullable()->after('started_at');
            $table->timestamp('completed_at')->nullable()->after('last_accessed_at');
            $table->unique(['enrollment_id', 'lesson_id']);
            $table->index(['enrollment_id', 'status']);
            $table->index(['lesson_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            $table->dropForeign(['enrollment_id']);
            $table->dropForeign(['lesson_id']);
            $table->dropUnique(['enrollment_id', 'lesson_id']);
            $table->dropIndex(['enrollment_id', 'status']);
            $table->dropIndex(['lesson_id', 'status']);
            $table->dropColumn(['enrollment_id', 'lesson_id', 'status', 'completion_percentage', 'playback_position', 'started_at', 'last_accessed_at', 'completed_at']);
        });
    }
};
