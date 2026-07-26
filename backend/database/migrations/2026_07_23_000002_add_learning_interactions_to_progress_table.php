<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('playback_position');
            $table->boolean('is_bookmarked')->default(false)->after('notes');
            $table->boolean('is_important')->default(false)->after('is_bookmarked');
            $table->index(['enrollment_id', 'is_bookmarked'], 'progress_enrollment_bookmarked_index');
        });
    }

    public function down(): void
    {
        Schema::table('progress', function (Blueprint $table) {
            $table->dropIndex('progress_enrollment_bookmarked_index');
            $table->dropColumn(['notes', 'is_bookmarked', 'is_important']);
        });
    }
};
