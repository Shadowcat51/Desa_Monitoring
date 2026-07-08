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
        Schema::table('desas', function (Blueprint $table) {
            $table->dropColumn([
                'status_pemerintahan',
                'pelayanan_dasar',
                'infrastruktur',
                'aksesbilitas',
                'ikg',
                'indeks_desa',
                'kategori_indeks_desa',
                'tahun',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('desas', function (Blueprint $table) {
            $table->string('tahun')->nullable();
            $table->string('status_pemerintahan')->nullable();
            $table->float('pelayanan_dasar')->nullable();
            $table->float('infrastruktur')->nullable();
            $table->float('aksesbilitas')->nullable();
            $table->float('ikg')->nullable();
            $table->float('indeks_desa')->nullable();
            $table->string('kategori_indeks_desa')->nullable();
        });
    }
};
