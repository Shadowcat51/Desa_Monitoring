<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataPodes extends Model
{
    protected $fillable = [
        'desa_id',
        'tahun',
        'status_pemerintahan',
        'pelayanan_dasar',
        'infrastruktur',
        'aksesbilitas',
        'ikg',
        'indeks_desa',
        'kategori_indeks_desa',
    ];

    public function desa()
    {
        return $this->belongsTo(Desa::class);
    }
}
