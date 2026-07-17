<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('instructor_id')->after('id')->constrained('users')->restrictOnDelete();
            $table->foreignId('category_id')->after('instructor_id')->constrained()->restrictOnDelete();
            $table->string('title')->after('category_id');
            $table->string('slug')->after('title')->unique();
            $table->string('short_description', 500)->after('slug');
            $table->longText('description')->after('short_description');
            $table->string('thumbnail')->nullable()->after('description');
            $table->enum('level', ['beginner', 'intermediate', 'advanced'])->after('thumbnail')->index();
            $table->string('language', 50)->default('English')->after('level')->index();
            $table->unsignedInteger('duration')->default(0)->comment('Duration in minutes')->after('language');
            $table->decimal('price', 10, 2)->default(0)->after('duration');
            $table->char('currency', 3)->default('USD')->after('price');
            $table->enum('type', ['free', 'paid'])->after('currency')->index();
            $table->enum('status', ['draft', 'pending_review', 'published', 'rejected', 'archived'])->default('draft')->after('type')->index();
            $table->foreignId('reviewed_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->string('rejection_reason')->nullable()->after('reviewed_at');
            $table->timestamp('published_at')->nullable()->after('rejection_reason');

            $table->index(['status', 'category_id']);
            $table->index(['instructor_id', 'status']);
            $table->index(['type', 'price']);
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['instructor_id']);
            $table->dropForeign(['category_id']);
            $table->dropForeign(['reviewed_by']);
            $table->dropUnique(['slug']);
            $table->dropIndex(['status', 'category_id']);
            $table->dropIndex(['instructor_id', 'status']);
            $table->dropIndex(['type', 'price']);
            $table->dropColumn(['instructor_id', 'category_id', 'title', 'slug', 'short_description', 'description', 'thumbnail', 'level', 'language', 'duration', 'price', 'currency', 'type', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'published_at']);
        });
    }
};
