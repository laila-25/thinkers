<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreignId('user_id')->after('id')->index()->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->after('user_id')->index()->constrained()->restrictOnDelete();
            $table->decimal('amount', 10, 2)->after('course_id');
            $table->string('currency', 3)->default('USD')->after('amount');
            $table->string('status', 20)->default('pending')->after('currency')->index();
            $table->string('payment_method', 50)->nullable()->after('status');
            $table->string('transaction_id', 191)->nullable()->after('payment_method')->unique();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['transaction_id']);
            $table->dropIndex(['status']);
            $table->dropConstrainedForeignId('course_id');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['amount', 'currency', 'status', 'payment_method', 'transaction_id']);
        });
    }
};
