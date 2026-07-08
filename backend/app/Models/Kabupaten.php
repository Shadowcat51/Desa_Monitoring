<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kabupaten extends Model
{
    protected $guarded = [];

    public function kecamatans()
    {
        return $this->hasMany(Kecamatan::class);
    }
}
