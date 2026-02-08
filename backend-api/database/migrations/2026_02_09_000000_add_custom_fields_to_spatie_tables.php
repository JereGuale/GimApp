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
        Schema::table('roles', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->string('description')->nullable()->after('display_name');
            $table->boolean('is_active')->default(true)->after('description');
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->string('description')->nullable()->after('display_name');
            $table->string('category')->nullable()->after('description');
            $table->string('scope')->nullable()->after('category');
            $table->boolean('is_active')->default(true)->after('scope');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'description', 'is_active']);
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'description', 'category', 'scope', 'is_active']);
        });
    }
};
