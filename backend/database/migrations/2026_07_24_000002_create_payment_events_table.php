<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 30);
            $table->string('event_id', 191);
            $table->string('type', 100)->index();
            $table->string('status', 20)->default('processing')->index();
            $table->char('payload_hash', 64);
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_events');
    }
};
