<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('categories')->nullOnDelete();
            $table->string('name')->after('parent_id')->unique();
            $table->string('slug')->after('name')->unique();
            $table->text('description')->nullable()->after('slug');
            $table->boolean('is_active')->default(true)->after('description')->index();
            $table->unsignedInteger('sort_order')->default(0)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropUnique(['name']);
            $table->dropUnique(['slug']);
            $table->dropIndex(['is_active']);
            $table->dropColumn(['parent_id', 'name', 'slug', 'description', 'is_active', 'sort_order']);
        });
    }
};
