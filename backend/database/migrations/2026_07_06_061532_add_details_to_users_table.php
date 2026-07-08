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
            $table->string('no_telp')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamp('last_login_at')->nullable();
            $table->foreignId('assigned_kabupaten_id')->nullable()->constrained('kabupatens')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['assigned_kabupaten_id']);
            $table->dropColumn(['no_telp', 'is_active', 'last_login_at', 'assigned_kabupaten_id']);
        });
    }
};
