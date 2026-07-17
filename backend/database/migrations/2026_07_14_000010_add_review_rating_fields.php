<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->after('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating')->after('course_id');
            $table->text('review_text')->after('rating');
            $table->enum('status', ['published', 'hidden', 'pending'])->default('published')->after('review_text');
            $table->unique(['user_id', 'course_id']);
            $table->index(['course_id', 'status', 'created_at']);
            $table->index(['status', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['course_id']);
            $table->dropUnique(['user_id', 'course_id']);
            $table->dropIndex(['course_id', 'status', 'created_at']);
            $table->dropIndex(['status', 'rating']);
            $table->dropColumn(['user_id', 'course_id', 'rating', 'review_text', 'status']);
        });
    }
};
