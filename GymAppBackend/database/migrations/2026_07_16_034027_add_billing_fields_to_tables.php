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
            $table->string('billing_id_number')->nullable();
            $table->string('billing_city')->nullable();
            $table->text('billing_address')->nullable();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('billing_name')->nullable();
            $table->string('billing_email')->nullable();
            $table->string('billing_phone')->nullable();
            $table->string('billing_id_number')->nullable();
            $table->string('billing_city')->nullable();
            $table->text('billing_address')->nullable();
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('billing_name')->nullable();
            $table->string('billing_email')->nullable();
            $table->string('billing_phone')->nullable();
            $table->string('billing_id_number')->nullable();
            $table->string('billing_city')->nullable();
            $table->text('billing_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['billing_id_number', 'billing_city', 'billing_address']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'billing_name', 'billing_email', 'billing_phone',
                'billing_id_number', 'billing_city', 'billing_address'
            ]);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'billing_name', 'billing_email', 'billing_phone',
                'billing_id_number', 'billing_city', 'billing_address'
            ]);
        });
    }
};
