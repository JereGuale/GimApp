<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'billing_name')) {
                $table->string('billing_name')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'billing_email')) {
                $table->string('billing_email')->nullable()->after('billing_name');
            }
            if (!Schema::hasColumn('users', 'billing_phone')) {
                $table->string('billing_phone')->nullable()->after('billing_email');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['billing_name', 'billing_email', 'billing_phone']);
        });
    }
};
