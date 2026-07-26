<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'id'], 'ai_messages_conversation_id_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('ai_messages', function (Blueprint $table) {
            $table->dropIndex('ai_messages_conversation_id_id_index');
        });
    }
};
