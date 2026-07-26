<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('certificates')->where('status', 'active')->update(['status' => 'issued']);
        DB::table('certificates')->where('status', 'failed')->update(['status' => 'pending']);
    }

    public function down(): void
    {
        DB::table('certificates')->where('status', 'issued')->update(['status' => 'active']);
    }
};
