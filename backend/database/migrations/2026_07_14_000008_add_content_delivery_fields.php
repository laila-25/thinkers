<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->longText('text_content')->nullable()->after('description');
            $table->timestamp('content_updated_at')->nullable()->after('is_published');
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->foreignId('lesson_id')->after('id')->unique()->constrained()->cascadeOnDelete();
            $table->string('disk')->default('course_media')->after('lesson_id');
            $table->string('path')->after('disk');
            $table->string('original_name')->after('path');
            $table->string('mime_type', 100)->after('original_name');
            $table->unsignedBigInteger('file_size')->after('mime_type');
            $table->unsignedInteger('duration_seconds')->nullable()->after('file_size');
            $table->string('checksum', 64)->after('duration_seconds');
            $table->string('provider', 30)->default('local')->after('checksum');
            $table->string('provider_asset_id')->nullable()->after('provider');
            $table->enum('processing_status', ['pending', 'processing', 'ready', 'failed'])->default('ready')->after('provider_asset_id');
            $table->text('processing_error')->nullable()->after('processing_status');
            $table->timestamp('processed_at')->nullable()->after('processing_error');
            $table->index(['processing_status', 'created_at']);
        });

        Schema::table('attachments', function (Blueprint $table) {
            $table->foreignId('lesson_id')->after('id')->constrained()->cascadeOnDelete();
            $table->string('disk')->default('course_media')->after('lesson_id');
            $table->string('path')->after('disk');
            $table->string('original_name')->after('path');
            $table->string('display_name')->after('original_name');
            $table->string('mime_type', 150)->after('display_name');
            $table->string('extension', 10)->after('mime_type');
            $table->unsignedBigInteger('file_size')->after('extension');
            $table->string('checksum', 64)->after('file_size');
            $table->unsignedInteger('position')->default(1)->after('checksum');
            $table->boolean('is_downloadable')->default(true)->after('position');
            $table->index(['lesson_id', 'position']);
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->foreignId('lesson_id')->nullable()->after('id')->unique()->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lesson_id');
        });
        Schema::table('attachments', function (Blueprint $table) {
            $table->dropForeign(['lesson_id']);
            $table->dropIndex(['lesson_id', 'position']);
            $table->dropColumn(['lesson_id', 'disk', 'path', 'original_name', 'display_name', 'mime_type', 'extension', 'file_size', 'checksum', 'position', 'is_downloadable']);
        });
        Schema::table('videos', function (Blueprint $table) {
            $table->dropForeign(['lesson_id']);
            $table->dropIndex(['processing_status', 'created_at']);
            $table->dropColumn(['lesson_id', 'disk', 'path', 'original_name', 'mime_type', 'file_size', 'duration_seconds', 'checksum', 'provider', 'provider_asset_id', 'processing_status', 'processing_error', 'processed_at']);
        });
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['text_content', 'content_updated_at']);
        });
    }
};
