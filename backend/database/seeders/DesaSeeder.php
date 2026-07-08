<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Kabupaten;
use App\Models\Kecamatan;
use App\Models\Desa;

class DesaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    private function cleanName(string $name): string
    {
        $name = strtoupper(trim($name));
        $name = preg_replace('/^(DESA|KELURAHAN|KAB\.|KABUPATEN|KOTA|KECAMATAN)\s+/i', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return trim($name);
    }

    public function run(): void
    {
        $path = storage_path('app/seed_data.geojson');
        if (!file_exists($path)) {
            $this->command->error("GeoJSON file not found at: {$path}");
            return;
        }

        $this->command->info("Reading GeoJSON file...");
        $json = file_get_contents($path);
        $data = json_decode($json, true);

        if (!isset($data['features'])) {
            $this->command->error("Invalid GeoJSON format.");
            return;
        }

        $features = $data['features'];
        $this->command->info("Found " . count($features) . " features. Seeding...");

        $bar = $this->command->getOutput()->createProgressBar(count($features));
        $bar->start();

        foreach ($features as $idx => $feature) {
            $props = $feature['properties'];
            
            // Kabupaten
            $kabNameRaw = $props['Nama Kabupaten'] ?? $props['WADMKK'] ?? 'Unknown Kabupaten';
            $kabName = $this->cleanName($kabNameRaw);
            $kabupaten = Kabupaten::firstOrCreate(['nama' => $kabName]);

            // Kecamatan
            $kecNameRaw = $props['Nama Kecamatan'] ?? $props['WADMKC'] ?? 'Unknown Kecamatan';
            $kecName = $this->cleanName($kecNameRaw);
            $kecamatan = Kecamatan::firstOrCreate([
                'kabupaten_id' => $kabupaten->id,
                'nama' => $kecName
            ]);
            
            $ikg = $props['IKG'] ?? null;
            $status = $props['Kategori Indeks Desa'] ?? null;
            
            // Normalize Kategori to simple status
            $cleanStatus = 'Belum di data';
            if ($status) {
                if (stripos($status, 'Mandiri') !== false) {
                    $cleanStatus = 'Mandiri';
                } elseif (stripos($status, 'Maju') !== false) {
                    $cleanStatus = 'Maju';
                } elseif (stripos($status, 'Berkembang') !== false) {
                    $cleanStatus = 'Berkembang';
                } elseif (stripos($status, 'Tertinggal') !== false) {
                    $cleanStatus = 'Tertinggal';
                }
            }

            $desaNameRaw = $props['Nama Desa/Kelurahan'] ?? $props['WADMKD'] ?? $props['NAMOBJ'] ?? null;
            $cleanDesaName = $desaNameRaw ? $this->cleanName($desaNameRaw) : null;
            
            $kodeDesa = $props['Code'] ?? null;
            if (!$kodeDesa && isset($props['IDDESA'])) {
                $kodeDesa = $props['IDDESA'];
            }
            if (!$kodeDesa && isset($props['KDEPUM'])) {
                $kodeDesa = str_replace('.', '', $props['KDEPUM']);
            }
            if (!$kodeDesa && isset($props['KDBBPS'])) {
                $kodeDesa = str_replace('.', '', $props['KDBBPS']);
            }

            Desa::create([
                'kecamatan_id' => $kecamatan->id,
                'code' => $kodeDesa ?? (string)($idx),
                'kode_desa_kelurahan' => $kodeDesa,
                'nama_desa_kelurahan' => $cleanDesaName ?? $desaNameRaw ?? 'TIDAK DIKETAHUI',
                'latitude' => $props['centroid_lat'] ?? null,
                'longitude' => $props['centroid_lon'] ?? null,
                'geometry' => json_encode($feature['geometry']),
            ]);
            
            $bar->advance();
        }

        $bar->finish();
        $this->command->info("\nSeeding complete!");
    }
}
