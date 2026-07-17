<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('instructor_status', ['pending', 'approved', 'rejected'])->nullable()->after('password')->index();
            $table->timestamp('instructor_approved_at')->nullable()->after('instructor_status');
            $table->foreignId('instructor_approved_by')->nullable()->after('instructor_approved_at')->constrained('users')->nullOnDelete();
            $table->string('instructor_rejection_reason')->nullable()->after('instructor_approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['instructor_approved_by']);
            $table->dropColumn(['instructor_status', 'instructor_approved_at', 'instructor_approved_by', 'instructor_rejection_reason']);
        });
    }
};
