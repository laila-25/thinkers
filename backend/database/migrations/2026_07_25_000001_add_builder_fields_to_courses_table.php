<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table): void {
            $table->string('subtitle', 255)->nullable()->after('title');
            $table->json('learning_objectives')->nullable()->after('description');
            $table->json('requirements')->nullable()->after('learning_objectives');
            $table->json('target_audience')->nullable()->after('requirements');
            $table->string('promotional_video_path')->nullable()->after('thumbnail');
        });
        Schema::table('questions', fn (Blueprint $table) => $table->text('explanation')->nullable()->after('question_text'));
    }

    public function down(): void
    {
        Schema::table('questions', fn (Blueprint $table) => $table->dropColumn('explanation'));
        Schema::table('courses', fn (Blueprint $table) => $table->dropColumn([
            'subtitle', 'learning_objectives', 'requirements', 'target_audience', 'promotional_video_path',
        ]));
    }
};
