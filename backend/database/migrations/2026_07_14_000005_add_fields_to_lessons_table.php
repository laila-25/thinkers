<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('course_section_id')->after('id')->constrained()->cascadeOnDelete();
            $table->string('title')->after('course_section_id');
            $table->string('slug')->after('title');
            $table->text('description')->nullable()->after('slug');
            $table->enum('content_type', ['text', 'video', 'quiz', 'resource'])->default('text')->after('description');
            $table->unsignedInteger('duration')->default(0)->comment('Duration in minutes')->after('content_type');
            $table->unsignedInteger('position')->default(1)->after('duration');
            $table->boolean('is_preview')->default(false)->after('position');
            $table->boolean('is_published')->default(false)->after('is_preview');
            $table->unique(['course_section_id', 'slug']);
            $table->unique(['course_section_id', 'position']);
            $table->index(['is_published', 'content_type']);
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['course_section_id']);
            $table->dropUnique(['course_section_id', 'slug']);
            $table->dropUnique(['course_section_id', 'position']);
            $table->dropIndex(['is_published', 'content_type']);
            $table->dropColumn(['course_section_id', 'title', 'slug', 'description', 'content_type', 'duration', 'position', 'is_preview', 'is_published']);
        });
    }
};
