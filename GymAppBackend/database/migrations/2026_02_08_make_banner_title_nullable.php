<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promotional_banners', function (Blueprint $table) {
            $table->string('title')->nullable()->default('')->change();
        });
    }

    public function down(): void
    {
        Schema::table('promotional_banners', function (Blueprint $table) {
            $table->string('title')->nullable(false)->change();
        });
    }
};
