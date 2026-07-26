<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table): void {
            $table->foreignId('actor_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->string('action', 100)->after('actor_id');
            $table->nullableMorphs('subject');
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->index(['action', 'created_at']);
            $table->index(['actor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table): void {
            $table->dropIndex(['action', 'created_at']);
            $table->dropIndex(['actor_id', 'created_at']);
            $table->dropConstrainedForeignId('actor_id');
            $table->dropMorphs('subject');
            $table->dropColumn(['action', 'metadata', 'ip_address', 'user_agent']);
        });
    }
};
