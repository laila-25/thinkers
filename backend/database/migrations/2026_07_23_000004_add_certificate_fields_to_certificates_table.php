<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('certificates', 'user_id')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete());
        }
        if (! Schema::hasColumn('certificates', 'course_id')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->foreignId('course_id')->after('user_id')->constrained()->restrictOnDelete());
        }
        if (! Schema::hasColumn('certificates', 'certificate_number')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->string('certificate_number', 64)->unique());
        }
        if (! Schema::hasColumn('certificates', 'verification_code')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->string('verification_code', 64)->unique());
        }
        if (! Schema::hasColumn('certificates', 'issued_at')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->dateTime('issued_at')->useCurrent());
        }
        if (! Schema::hasColumn('certificates', 'pdf_path')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->string('pdf_path')->nullable());
        }
        if (! Schema::hasColumn('certificates', 'status')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->string('status', 20)->default('pending')->index());
        }
        if (! Schema::hasIndex('certificates', ['user_id', 'course_id'], 'unique')) {
            Schema::table('certificates', fn (Blueprint $table) => $table->unique(['user_id', 'course_id']));
        }
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'course_id']);
            $table->dropUnique(['certificate_number']);
            $table->dropUnique(['verification_code']);
            $table->dropIndex(['status']);
            $table->dropConstrainedForeignId('course_id');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['certificate_number', 'verification_code', 'issued_at', 'pdf_path', 'status']);
        });
    }
};
