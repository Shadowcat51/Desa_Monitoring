<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Perbaiki format kolom `code` di tabel desas.
     * 
     * Sebelum: 73.10.01.2008  (format KDEPUM dengan titik dari shapefile 10K)
     * Sesudah: 7309010008     (format BPS 10-digit, sumber kebenaran = kode_desa_kelurahan)
     * 
     * Strategi: Jika kode_desa_kelurahan sudah berupa angka 10 digit → pakai itu sebagai code.
     *           Jika tidak, coba konversi format titik ke BPS.
     */
    public function up(): void
    {
        // Strategy 1: Jika kode_desa_kelurahan adalah angka numeric dengan panjang 9-13 → copy ke code
        // SQLite-compatible: pakai CAST + LENGTH + GLOB
        DB::statement("
            UPDATE desas
            SET code = kode_desa_kelurahan
            WHERE kode_desa_kelurahan IS NOT NULL
              AND kode_desa_kelurahan != ''
              AND LENGTH(kode_desa_kelurahan) BETWEEN 9 AND 13
              AND CAST(kode_desa_kelurahan AS INTEGER) > 0
        ");

        // Strategy 2: Untuk code yang masih berformat titik (XX.XX.XX.XXXX)
        // Hapus semua titik
        DB::statement("
            UPDATE desas
            SET code = REPLACE(REPLACE(code, '.', ''), ' ', '')
            WHERE code LIKE '%.%.%'
        ");
    }

    public function down(): void
    {
        // Irreversible - format baru lebih benar
    }
};
