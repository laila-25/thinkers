<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructor_earnings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('order_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->decimal('gross_amount', 10, 2);
            $table->decimal('platform_fee', 10, 2);
            $table->decimal('instructor_amount', 10, 2);
            $table->string('currency', 3);
            $table->string('status', 20)->default('pending')->index();
            $table->timestamps();

            $table->index(['instructor_id', 'status', 'created_at']);
            $table->index(['course_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_earnings');
    }
};
