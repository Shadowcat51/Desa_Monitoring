<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\Desa;
use App\Models\DataPodes;
use Rap2hpoutre\FastExcel\FastExcel;

function cleanName(string $name): string {
    $name = strtoupper(trim($name));
    $name = preg_replace('/^(DESA|KELURAHAN|KAB\.|KABUPATEN|KOTA|KECAMATAN)\s+/i', '', $name);
    $name = preg_replace('/\s+/', ' ', $name);
    return trim($name);
}

$path = base_path('../data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx');
$data = (new FastExcel)->import($path);
$inserted = 0;
$skipped = 0;

foreach ($data as $line) {
    $namaKab = cleanName($line['Nama Kabupaten'] ?? '');
    $namaKec = cleanName($line['Nama Kecamatan'] ?? '');
    $namaDesa = cleanName($line['Nama Desa/Kelurahan'] ?? '');
    
    if (!$namaKab || !$namaKec || !$namaDesa) continue;
    
    $kodeBPS = $line['Code'] ?? '';
    $desa = null;
    
    if ($kodeBPS && strlen($kodeBPS) >= 10) {
        $desa = Desa::where('code', $kodeBPS)->orWhere('kode_desa_kelurahan', $kodeBPS)->first();
    }
    
    if (!$desa) {
        $desa = Desa::whereRaw('LOWER(nama_desa_kelurahan) = ?', [strtolower($namaDesa)])
            ->whereHas('kecamatan', function($q) use ($namaKec, $namaKab) {
                $q->whereRaw('LOWER(nama) = ?', [strtolower($namaKec)])
                    ->whereHas('kabupaten', function($q2) use ($namaKab) {
                        $q2->whereRaw('LOWER(nama) = ?', [strtolower($namaKab)]);
                    });
            })->first();
    }
        
    if ($desa) {
        DataPodes::updateOrCreate(
            ['desa_id' => $desa->id, 'tahun' => '2024'],
            [
                'pelayanan_dasar' => is_numeric($line['Pelayanan Dasar']) ? floatval($line['Pelayanan Dasar']) : null,
                'infrastruktur' => is_numeric($line['Infrastruktur']) ? floatval($line['Infrastruktur']) : null,
                'aksesbilitas' => is_numeric($line['Aksesbilitas']) ? floatval($line['Aksesbilitas']) : null,
                'ikg' => is_numeric($line['IKG']) ? floatval($line['IKG']) : null,
                'indeks_desa' => is_numeric($line['Indeks Desa']) ? floatval($line['Indeks Desa']) : null,
                'kategori_indeks_desa' => trim($line['Kategori Indeks Desa'] ?? ''),
            ]
        );
        $inserted++;
    } else {
        $skipped++;
    }
}
echo "Inserted/Updated: $inserted, Skipped: $skipped\n";
