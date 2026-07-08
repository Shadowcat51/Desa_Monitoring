<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('data_podes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('desa_id')->constrained('desas')->onDelete('cascade');
            $table->string('tahun');
            $table->string('status_pemerintahan')->nullable();
            $table->float('pelayanan_dasar')->nullable();
            $table->float('infrastruktur')->nullable();
            $table->float('aksesbilitas')->nullable();
            $table->float('ikg')->nullable();
            $table->float('indeks_desa')->nullable();
            $table->string('kategori_indeks_desa')->nullable();
            $table->timestamps();
        });

        // Transfer existing data from desas table to data_podes table
        $desas = DB::table('desas')->whereNotNull('tahun')->get();
        $podesData = [];
        $now = now();
        foreach ($desas as $desa) {
            $podesData[] = [
                'desa_id' => $desa->id,
                'tahun' => $desa->tahun,
                'status_pemerintahan' => $desa->status_pemerintahan,
                'pelayanan_dasar' => $desa->pelayanan_dasar,
                'infrastruktur' => $desa->infrastruktur,
                'aksesbilitas' => $desa->aksesbilitas,
                'ikg' => $desa->ikg,
                'indeks_desa' => $desa->indeks_desa,
                'kategori_indeks_desa' => $desa->kategori_indeks_desa,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insert in chunks to avoid memory limits
        foreach (array_chunk($podesData, 500) as $chunk) {
            DB::table('data_podes')->insert($chunk);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_podes');
    }
};
