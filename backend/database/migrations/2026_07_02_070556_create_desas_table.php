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
        Schema::create('desas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kecamatan_id')->nullable()->constrained('kecamatans')->onDelete('cascade');
            $table->string('kode_desa_kelurahan')->nullable();
            $table->string('code')->comment('13-digit BPS Code KDEPUM');
            $table->string('nama_desa_kelurahan')->nullable();
            $table->string('status_pemerintahan')->nullable();
            $table->float('pelayanan_dasar')->nullable();
            $table->float('infrastruktur')->nullable();
            $table->float('aksesbilitas')->nullable();
            $table->float('ikg')->nullable();
            $table->float('indeks_desa')->nullable();
            $table->string('kategori_indeks_desa')->nullable()->comment('Status Kesulitan');
            $table->float('latitude', 10, 6)->nullable();
            $table->float('longitude', 10, 6)->nullable();
            $table->json('geometry')->nullable(); // Store geojson geometry
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('desas');
    }
};
