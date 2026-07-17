<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->foreignId('course_id')->after('id')->constrained()->cascadeOnDelete();
            $table->string('title')->after('course_id');
            $table->text('description')->nullable()->after('title');
            $table->unsignedInteger('position')->default(1)->after('description');
            $table->unique(['course_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropUnique(['course_id', 'position']);
            $table->dropColumn(['course_id', 'title', 'description', 'position']);
        });
    }
};
