<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MapController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Desa::with(['kecamatan.kabupaten']);
        
        if ($request->filled('tahun')) {
            $tahun = $request->tahun;
            $query->where(function($q) use ($tahun) {
                $q->whereHas('dataPodes', function($sub) use ($tahun) {
                    $sub->where('tahun', $tahun);
                })->orWhereNotNull('geometry');
            });
            $query->with(['dataPodes' => function($q) use ($tahun) {
                $q->where('tahun', $tahun);
            }]);
        } else {
            $query->with('latestDataPodes');
        }

        $desas = $query->get();
        $features = [];

        foreach ($desas as $desa) {
            $dataPodes = $request->filled('tahun')
                ? $desa->dataPodes->first()
                : $desa->latestDataPodes;

            $kategori = $dataPodes ? $dataPodes->kategori_indeks_desa : null;
            $status_kesulitan = 'Belum di data';
            $color = '#94a3b8'; // Abu-abu

            if ($kategori) {
                if (str_contains(strtolower($kategori), 'mandiri')) {
                    $status_kesulitan = 'Mandiri';
                    $color = '#3b82f6'; // Biru (Blue)
                } elseif (str_contains(strtolower($kategori), 'maju')) {
                    $status_kesulitan = 'Maju';
                    $color = '#22c55e'; // Hijau
                } elseif (str_contains(strtolower($kategori), 'berkembang')) {
                    $status_kesulitan = 'Berkembang';
                    $color = '#eab308'; // Kuning
                } elseif (str_contains(strtolower($kategori), 'tertinggal')) {
                    $status_kesulitan = 'Tertinggal';
                    $color = '#ef4444'; // Merah
                }
            }

            $features[] = [
                'type' => 'Feature',
                'geometry' => json_decode($desa->geometry, true),
                'properties' => [
                    'id' => $desa->id,
                    'code' => $desa->code ?? $desa->kode_desa_kelurahan,
                    'nama_kabupaten' => $desa->kecamatan ? ($desa->kecamatan->kabupaten ? $desa->kecamatan->kabupaten->nama : null) : null,
                    'nama_kecamatan' => $desa->kecamatan ? $desa->kecamatan->nama : null,
                    'nama_desa_kelurahan' => $desa->nama_desa_kelurahan,
                    'latitude' => $desa->latitude,
                    'longitude' => $desa->longitude,
                    'pelayanan_dasar' => $dataPodes ? $dataPodes->pelayanan_dasar : null,
                    'infrastruktur' => $dataPodes ? $dataPodes->infrastruktur : null,
                    'aksesbilitas' => $dataPodes ? $dataPodes->aksesbilitas : null,
                    'ikg' => $dataPodes ? $dataPodes->ikg : null,
                    'indeks_desa' => $dataPodes ? $dataPodes->indeks_desa : null,
                    'kategori_indeks_desa' => $kategori,
                    'status_kesulitan' => $status_kesulitan,
                    'foto_kantor' => $desa->foto_kantor,
                    'tahun' => $dataPodes ? $dataPodes->tahun : null,
                    'color' => $color
                ]
            ];
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features
        ]);
    }

    public function labels()
    {
        $features = [];

        // Provinsi
        $features[] = [
            'type' => 'Feature',
            'geometry' => ['type' => 'Point', 'coordinates' => [119.9, -3.5]],
            'properties' => [
                'name' => 'PROVINSI SULAWESI SELATAN',
                'level' => 'provinsi'
            ]
        ];

        // Kabupaten
        $kabupatens = \Illuminate\Support\Facades\DB::table('desas')
            ->join('kecamatans', 'desas.kecamatan_id', '=', 'kecamatans.id')
            ->join('kabupatens', 'kecamatans.kabupaten_id', '=', 'kabupatens.id')
            ->select('kabupatens.nama', \Illuminate\Support\Facades\DB::raw('AVG(desas.latitude) as lat, AVG(desas.longitude) as lng'))
            ->whereNotNull('desas.latitude')
            ->groupBy('kabupatens.id', 'kabupatens.nama')
            ->get();

        foreach ($kabupatens as $kab) {
            $features[] = [
                'type' => 'Feature',
                'geometry' => ['type' => 'Point', 'coordinates' => [(float)$kab->lng, (float)$kab->lat]],
                'properties' => [
                    'name' => strtoupper($kab->nama),
                    'level' => 'kabupaten'
                ]
            ];
        }

        // Kecamatan
        $kecamatans = \Illuminate\Support\Facades\DB::table('desas')
            ->join('kecamatans', 'desas.kecamatan_id', '=', 'kecamatans.id')
            ->select('kecamatans.nama', \Illuminate\Support\Facades\DB::raw('AVG(desas.latitude) as lat, AVG(desas.longitude) as lng'))
            ->whereNotNull('desas.latitude')
            ->groupBy('kecamatans.id', 'kecamatans.nama')
            ->get();

        foreach ($kecamatans as $kec) {
            $features[] = [
                'type' => 'Feature',
                'geometry' => ['type' => 'Point', 'coordinates' => [(float)$kec->lng, (float)$kec->lat]],
                'properties' => [
                    'name' => strtoupper($kec->nama),
                    'level' => 'kecamatan'
                ]
            ];
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features
        ]);
    }
}
