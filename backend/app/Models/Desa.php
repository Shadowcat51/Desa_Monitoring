<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Desa extends Model
{
    protected $guarded = [];

    public function kecamatan()
    {
        return $this->belongsTo(Kecamatan::class);
    }

    public function dataPodes()
    {
        return $this->hasMany(DataPodes::class);
    }

    public function latestDataPodes()
    {
        return $this->hasOne(DataPodes::class)->latestOfMany('tahun');
    }
}
