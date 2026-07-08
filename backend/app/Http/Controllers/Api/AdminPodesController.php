<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Desa;
use App\Models\DataPodes;
use App\Models\Kabupaten;
use App\Models\Kecamatan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Rap2hpoutre\FastExcel\FastExcel;

class AdminPodesController extends Controller
{
    // =========================================================================
    // LIST DATA PODES — Tampilkan SEMUA desa, load data podes sesuai tahun
    // =========================================================================
    public function index(Request $request)
    {
        // Base query: semua desa dengan relasi statis
        $query = Desa::with(['kecamatan.kabupaten']);

        // Eager-load data_podes untuk tahun yg dipilih (atau terbaru)
        // TIDAK menggunakan whereHas agar desa tanpa data tetap muncul (abu-abu)
        if ($request->filled('tahun')) {
            $tahun = $request->tahun;
            $query->with(['dataPodes' => function($q) use ($tahun) {
                $q->where('tahun', $tahun);
            }]);
        } else {
            $query->with('latestDataPodes');
        }

        // Search by nama desa, kode, atau kecamatan
        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(nama_desa_kelurahan) LIKE ?', ["%{$search}%"])
                  ->orWhere('code', 'LIKE', "%{$search}%")
                  ->orWhere('kode_desa_kelurahan', 'LIKE', "%{$search}%")
                  ->orWhereHas('kecamatan', function($q) use ($search) {
                      $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"]);
                  })
                  ->orWhereHas('kecamatan.kabupaten', function($q) use ($search) {
                      $q->whereRaw('LOWER(nama) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        if ($request->filled('tahun')) {
            $reqTahun = $request->tahun;
            // Desa ditampilkan jika:
            // 1. Ia punya data_podes di tahun tersebut
            // 2. ATAU ia adalah desa bawaan dari GeoJSON (geometry is not null)
            $query->where(function($q) use ($reqTahun) {
                $q->whereHas('dataPodes', function($sub) use ($reqTahun) {
                    $sub->where('tahun', $reqTahun);
                })->orWhereNotNull('geometry');
            });
        }

        // Filter by Status — harus join/subquery ke data_podes untuk filter ini
        if ($request->filled('status') && $request->status !== 'Semua Status') {
            $status = $request->status;
            $tahun  = $request->filled('tahun') ? $request->tahun : null;

            if ($status === 'Belum di data') {
                // Desa yang tidak punya data_podes di tahun tsb, atau kategoriny null
                $query->where(function($q) use ($tahun) {
                    $q->whereDoesntHave('dataPodes', function($sub) use ($tahun) {
                        $sub->when($tahun, fn($s) => $s->where('tahun', $tahun))
                            ->whereNotNull('kategori_indeks_desa');
                    });
                });
            } else {
                $query->whereHas('dataPodes', function($q) use ($status, $tahun) {
                    $q->when($tahun, fn($s) => $s->where('tahun', $tahun))
                      ->where('kategori_indeks_desa', 'LIKE', "%{$status}%");
                });
            }
        }

        // Filter by Kabupaten
        if ($request->filled('kabupaten') && $request->kabupaten !== 'Semua Kabupaten') {
            $kabupaten = strtolower($request->kabupaten);
            $query->whereHas('kecamatan.kabupaten', function($q) use ($kabupaten) {
                $q->whereRaw('LOWER(nama) = ?', [$kabupaten]);
            });
        }

        // Add Sorting (Status then Alphabetical)
        $reqTahun = $request->filled('tahun') ? $request->tahun : null;
        $query->addSelect(['kategori_sort' => \App\Models\DataPodes::selectRaw("
            CASE 
                WHEN LOWER(kategori_indeks_desa) LIKE '%mandiri%' THEN 1
                WHEN LOWER(kategori_indeks_desa) LIKE '%maju%' THEN 2
                WHEN LOWER(kategori_indeks_desa) LIKE '%berkembang%' THEN 3
                WHEN LOWER(kategori_indeks_desa) LIKE '%tertinggal%' THEN 4
                ELSE 5
            END
        ")
        ->whereColumn('desa_id', 'desas.id')
        ->when($reqTahun, function($q) use ($reqTahun) {
            $q->where('tahun', $reqTahun);
        })
        ->orderByDesc('tahun') // Fallback to get the latest if no year specified
        ->limit(1)]);

        $query->orderByRaw('IFNULL(kategori_sort, 5) ASC');
        $query->orderBy('nama_desa_kelurahan', 'ASC');

        $perPage = 30;
        $desas   = $query->paginate($perPage);

        $desas->getCollection()->transform(function ($desa) use ($request) {
            $dataPodes = $request->filled('tahun')
                ? $desa->dataPodes->first()
                : $desa->latestDataPodes;

            $kategori        = $dataPodes ? $dataPodes->kategori_indeks_desa : null;
            $status_kesulitan = 'Belum di data';

            if ($kategori) {
                if (str_contains(strtolower($kategori), 'mandiri'))       $status_kesulitan = 'Mandiri';
                elseif (str_contains(strtolower($kategori), 'maju'))      $status_kesulitan = 'Maju';
                elseif (str_contains(strtolower($kategori), 'berkembang')) $status_kesulitan = 'Berkembang';
                elseif (str_contains(strtolower($kategori), 'tertinggal')) $status_kesulitan = 'Tertinggal';
            }

            return [
                'id'               => $desa->id,
                'kode_desa'        => $desa->code ?? $desa->kode_desa_kelurahan,
                'nama_desa'        => $desa->nama_desa_kelurahan,
                'kecamatan'        => $desa->kecamatan ? $desa->kecamatan->nama : null,
                'kabupaten'        => $desa->kecamatan && $desa->kecamatan->kabupaten ? $desa->kecamatan->kabupaten->nama : null,
                'status_kesulitan' => $status_kesulitan,
                'pelayanan_dasar'  => $dataPodes ? $dataPodes->pelayanan_dasar : null,
                'infrastruktur'    => $dataPodes ? $dataPodes->infrastruktur : null,
                'aksesbilitas'     => $dataPodes ? $dataPodes->aksesbilitas : null,
                'ikg'              => $dataPodes ? $dataPodes->ikg : null,
                'indeks_desa'      => $dataPodes ? $dataPodes->indeks_desa : null,
                'has_foto'         => !empty($desa->foto_kantor),
                'foto_kantor'      => $desa->foto_kantor,
                'tanggal_update'   => $dataPodes && $dataPodes->updated_at
                                        ? $dataPodes->updated_at->format('Y-m-d')
                                        : ($desa->updated_at ? $desa->updated_at->format('Y-m-d') : null),
                'tahun'            => $dataPodes ? $dataPodes->tahun : null,
            ];
        });

        return response()->json($desas);
    }

    // =========================================================================
    // EDIT SINGLE DATA - Edit Data Podes untuk 1 Desa melalui UI
    // =========================================================================
    public function updateSingle(Request $request, $id)
    {
        $desa = Desa::findOrFail($id);
        
        $request->validate([
            'tahun' => 'required',
            'kode_desa' => 'nullable|string',
            'nama_desa' => 'required|string',
            'kecamatan' => 'required|string',
            'kabupaten' => 'required|string',
        ]);
        
        // Update relasi wilayah
        $namaKab = strtoupper(trim($request->kabupaten));
        $namaKec = strtoupper(trim($request->kecamatan));
        
        $kabupaten = Kabupaten::firstOrCreate(['nama_kabupaten' => $namaKab]);
        $kecamatan = Kecamatan::firstOrCreate([
            'nama_kecamatan' => $namaKec,
            'kabupaten_id' => $kabupaten->id
        ]);
        
        // Update Data Desa (Statis)
        $desa->update([
            'code' => $request->kode_desa,
            'nama_desa_kelurahan' => strtoupper(trim($request->nama_desa)),
            'kecamatan_id' => $kecamatan->id
        ]);
        
        // Update Data Podes (Dinamis)
        $dataPodes = DataPodes::where('desa_id', $desa->id)
            ->where('tahun', $request->tahun)
            ->first();
            
        if ($dataPodes) {
            $dataPodes->update([
                'kategori_indeks_desa' => $request->status_kesulitan,
                'skor_pelayanan_dasar' => $request->pelayanan_dasar,
                'skor_infrastruktur'   => $request->infrastruktur,
                'skor_aksesbilitas'    => $request->aksesbilitas,
                'skor_ikg'             => $request->ikg,
                'skor_indeks_desa'     => $request->indeks_desa,
            ]);
        } else {
            DataPodes::create([
                'desa_id'              => $desa->id,
                'tahun'                => $request->tahun,
                'kategori_indeks_desa' => $request->status_kesulitan,
                'skor_pelayanan_dasar' => $request->pelayanan_dasar,
                'skor_infrastruktur'   => $request->infrastruktur,
                'skor_aksesbilitas'    => $request->aksesbilitas,
                'skor_ikg'             => $request->ikg,
                'skor_indeks_desa'     => $request->indeks_desa,
            ]);
        }
        
        return response()->json([
            'message' => 'Data berhasil diperbarui.'
        ]);
    }

    // =========================================================================
    // GET AVAILABLE YEARS
    // =========================================================================
    public function years()
    {
        $years = DB::table('data_podes')
            ->select('tahun as year')
            ->whereNotNull('tahun')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');

        if ($years->isEmpty()) {
            $years = collect([date('Y')]);
        }

        return response()->json($years);
    }

    // =========================================================================
    // UPLOAD DATA PODES — handles DRAFT & Fix format, creates new desas
    // =========================================================================
    public function uploadData(Request $request)
    {
        $request->validate([
            'file'  => 'required|file|mimes:xlsx,xls,csv|max:102400',
            'tahun' => 'required|string',
        ]);

        $tahun    = $request->tahun;
        $file     = $request->file('file');
        $path     = $file->storeAs('temp', time() . '_' . $file->getClientOriginalName(), 'local');
        $fullPath = Storage::disk('local')->path($path);

        // Load DBF Podes 2025 sebagai sumber lookup desa baru
        $dbfPath   = base_path('../data_podes/73_podes2025-desa-Gabung.dbf');
        $dbfLookup = $this->loadDbfLookup($dbfPath);

        $insertedCount = 0;
        $updatedCount  = 0;
        $skippedCount  = 0;
        $newDesaCount  = 0;
        $errors        = [];

        $allDesas = Desa::with('kecamatan.kabupaten')->get();

        DB::beginTransaction();
        try {
            (new FastExcel)->import($fullPath, function ($line) use (
                $tahun, $dbfLookup, $allDesas,
                &$insertedCount, &$updatedCount, &$skippedCount, &$newDesaCount, &$errors
            ) {
                // Skip empty rows
                $allEmpty = true;
                foreach ($line as $val) {
                    if ($val !== null && $val !== '') { $allEmpty = false; break; }
                }
                if ($allEmpty) return;

                $keys = array_keys($line);

                // -------------------------------------------------------
                // STEP 1: Detect column names (DRAFT 2025 vs Fix 2024)
                // DRAFT: nama_kab, nama_kec, nama_desa, kode_desa
                // Fix:   Nama Kabupaten, Nama Kecamatan, Nama Desa/Kelurahan, Code
                // -------------------------------------------------------
                $kabKey  = $this->findKeyExact($keys, ['nama_kab',  'Nama Kabupaten']);
                $kecKey  = $this->findKeyExact($keys, ['nama_kec',  'Nama Kecamatan']);
                $desaKey = $this->findKeyExact($keys, ['nama_desa', 'Nama Desa/Kelurahan']);
                $kodeKey = $this->findKeyExact($keys, ['kode_desa', 'Code']);

                if (!$kabKey || !$kecKey || !$desaKey) return;

                $namaKab  = $this->cleanName((string)($line[$kabKey]  ?? ''));
                $namaKec  = $this->cleanName((string)($line[$kecKey]  ?? ''));
                $namaDesa = $this->cleanName((string)($line[$desaKey] ?? ''));
                $kodeBPS  = $kodeKey ? trim((string)($line[$kodeKey] ?? '')) : '';

                if (!$namaKab || !$namaKec || !$namaDesa) return;

                // -------------------------------------------------------
                // STEP 2: Cari Desa via Trisula Nama (Utama)
                // -------------------------------------------------------
                $desa = Desa::whereRaw('LOWER(nama_desa_kelurahan) = ?', [strtolower($namaDesa)])
                    ->whereHas('kecamatan', function($q) use ($namaKec, $namaKab) {
                        $q->whereRaw('LOWER(nama) = ?', [strtolower($namaKec)])
                          ->whereHas('kabupaten', function($q2) use ($namaKab) {
                              $q2->whereRaw('LOWER(nama) = ?', [strtolower($namaKab)]);
                          });
                    })
                    ->with(['kecamatan.kabupaten'])
                    ->first();
                
                // Fallback ke Kode BPS jika nama tidak cocok (untuk Self-Healing dari Peta 10K)
                if (!$desa && $kodeBPS && strlen($kodeBPS) >= 10) {
                    $desa = Desa::where('code', $kodeBPS)->orWhere('kode_desa_kelurahan', $kodeBPS)->first();
                }

                // -------------------------------------------------------
                // STEP 2.5: Fuzzy Matching untuk menoleransi typo / perbedaan spasi
                // -------------------------------------------------------
                if (!$desa) {
                    $newKab = $this->slugify($namaKab);
                    $newKec = $this->slugify($namaKec);
                    $newDesaSlug = $this->slugify($namaDesa);

                    foreach ($allDesas as $candidate) {
                        $baseKab = $this->slugify($candidate->kecamatan->kabupaten->nama ?? '');
                        $baseKec = $this->slugify($candidate->kecamatan->nama ?? '');
                        $baseDesa = $this->slugify($candidate->nama_desa_kelurahan);

                        $kabMatch = (strpos($baseKab, $newKab) !== false || strpos($newKab, $baseKab) !== false);
                        $kecMatch = (strpos($baseKec, $newKec) !== false || strpos($newKec, $baseKec) !== false);
                        
                        $desaMatch = ($baseDesa === $newDesaSlug || levenshtein($baseDesa, $newDesaSlug) <= 2);
                        
                        $codeMatch = false;
                        if ($candidate->code && $kodeBPS && strlen($candidate->code) >= 6 && strlen($kodeBPS) >= 6) {
                            $codeMatch = (substr($candidate->code, -6) === substr($kodeBPS, -6));
                        }

                        if ($kabMatch && $kecMatch && ($desaMatch || $codeMatch)) {
                            $desa = $candidate;
                            break;
                        }
                    }
                }

                // -------------------------------------------------------
                // STEP 3: Jika desa tidak ditemukan → buat desa baru
                // Sumber: DBF lookup dari 73_podes2025-desa-Gabung.dbf
                // -------------------------------------------------------
                if (!$desa) {
                    $desa = $this->createNewDesa($namaKab, $namaKec, $namaDesa, $kodeBPS, $dbfLookup, $tahun);
                    if ($desa) {
                        $newDesaCount++;
                    } else {
                        $skippedCount++;
                        return;
                    }
                }

                // -------------------------------------------------------
                // STEP 4: Self-Healing Kode BPS (10-digit)
                // -------------------------------------------------------
                if ($kodeBPS && strlen($kodeBPS) >= 10) {
                    if (empty($desa->code) || strlen($desa->code) < 10 || $desa->code !== $kodeBPS) {
                        $kabCode = substr($kodeBPS, 2, 2);
                        $kecCode = substr($kodeBPS, 4, 3);

                        $desa->code = $kodeBPS;
                        $desa->kode_desa_kelurahan = $kodeBPS;
                        $desa->save();

                        $kecamatan = $desa->kecamatan;
                        if ($kecamatan) {
                            if (empty($kecamatan->kode)) {
                                $kecamatan->kode = $kecCode;
                                $kecamatan->save();
                            }
                            $kabupaten = $kecamatan->kabupaten;
                            if ($kabupaten && empty($kabupaten->kode)) {
                                $kabupaten->kode = $kabCode;
                                $kabupaten->save();
                            }
                        }
                    }
                }

                // -------------------------------------------------------
                // STEP 5: Extract nilai metrik
                // DRAFT 2025: Pelayanan_Dasar2025, Infrastruktur2025, Aksesbilitas2025, IKG2025
                // Fix 2024:   Pelayanan Dasar, Infrastruktur, Aksesbilitas, IKG, Indeks Desa, Kategori Indeks Desa
                // -------------------------------------------------------
                $pdKey  = $this->findKeyContains($keys, ['Pelayanan_Dasar', 'Pelayanan Dasar']);
                $infKey = $this->findKeyContains($keys, ['Infrastruktur']);
                $aksKey = $this->findKeyContains($keys, ['Aksesbilitas']);
                $ikgKey = $this->findKeyContains($keys, ['IKG']);
                $idKey  = $this->findKeyExact($keys, ['Indeks Desa']);
                $kidKey = $this->findKeyExact($keys, ['Kategori Indeks Desa']);

                $valPD  = $this->parseFloat($line, $pdKey);
                $valInf = $this->parseFloat($line, $infKey);
                $valAks = $this->parseFloat($line, $aksKey);
                $valIKG = $this->parseFloat($line, $ikgKey);
                $valID  = $this->parseFloat($line, $idKey);
                $valKID = ($kidKey && isset($line[$kidKey]) && $line[$kidKey] !== null && $line[$kidKey] !== '')
                            ? trim((string)$line[$kidKey]) : null;

                // -------------------------------------------------------
                // STEP 6: Fallback / Pewarisan Data Draft
                // Jika Indeks Desa & Kategori tidak ada → pinjam dari tahun sebelumnya
                // Jika tahun sebelumnya juga tidak ada → biarkan null (desa abu-abu)
                // -------------------------------------------------------
                if ($valID === null || $valKID === null) {
                    $prevPodes = DataPodes::where('desa_id', $desa->id)
                        ->where('tahun', (string)(intval($tahun) - 1))
                        ->first();
                    if ($prevPodes) {
                        if ($valID  === null) $valID  = $prevPodes->indeks_desa;
                        if ($valKID === null) $valKID = $prevPodes->kategori_indeks_desa;
                    }
                }

                // -------------------------------------------------------
                // STEP 7: Upsert DataPodes
                // Jika field dari Excel null → JANGAN timpa data DB yang sudah ada
                // -------------------------------------------------------
                $podes = DataPodes::where('desa_id', $desa->id)->where('tahun', $tahun)->first();
                if ($podes) {
                    if ($valPD  !== null) $podes->pelayanan_dasar     = $valPD;
                    if ($valInf !== null) $podes->infrastruktur        = $valInf;
                    if ($valAks !== null) $podes->aksesbilitas         = $valAks;
                    if ($valIKG !== null) $podes->ikg                  = $valIKG;
                    if ($valID  !== null) $podes->indeks_desa          = $valID;
                    if ($valKID !== null) $podes->kategori_indeks_desa = $valKID;
                    $podes->save();
                    $updatedCount++;
                } else {
                    DataPodes::create([
                        'desa_id'              => $desa->id,
                        'tahun'                => $tahun,
                        'pelayanan_dasar'      => $valPD,
                        'infrastruktur'        => $valInf,
                        'aksesbilitas'         => $valAks,
                        'ikg'                  => $valIKG,
                        'indeks_desa'          => $valID,
                        'kategori_indeks_desa' => $valKID,
                    ]);
                    $insertedCount++;
                }
            });

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Storage::disk('local')->delete($path);
            return response()->json([
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ], 500);
        }

        Storage::disk('local')->delete($path);

        $message = "Data Tahun {$tahun} berhasil disinkronisasi. "
                 . "{$insertedCount} data baru, {$updatedCount} data diperbarui.";
        if ($newDesaCount > 0)  $message .= " {$newDesaCount} desa baru ditambahkan ke database.";
        if ($skippedCount > 0)  $message .= " {$skippedCount} baris dilewati.";

        return response()->json([
            'message'   => $message,
            'inserted'  => $insertedCount,
            'updated'   => $updatedCount,
            'new_desas' => $newDesaCount,
            'skipped'   => $skippedCount,
        ]);
    }

    // =========================================================================
    // HELPER: Slugify untuk pencocokan fuzzy (menghilangkan awalan, spasi, tanda baca)
    // =========================================================================
    private function slugify($text) {
        $text = strtoupper(trim($text));
        $text = preg_replace('/^(DESA|KELURAHAN|LEMBANG)\s+/', '', $text);
        $text = preg_replace('/[^A-Z0-9]/', '', $text);
        return $text;
    }

    // =========================================================================
    // Buat Desa Baru dari data DBF (untuk desa yang belum ada di DB)
    // =========================================================================
    private function createNewDesa($namaKab, $namaKec, $namaDesa, $kodeBPS, $dbfLookup, $tahun = null)
    {
        // 1. Dapatkan Kode yang benar
        $finalKode = $kodeBPS;

        // Jika tidak ada kode di Excel (misal Draft), cari di DBF
        if (!$finalKode) {
            $key = strtolower($namaKab) . '|' . strtolower($namaKec) . '|' . strtolower($namaDesa);
            $finalKode = $dbfLookup[$key] ?? '';
        }

        // Jika DBF juga tidak punya, return null (skip data ini)
        if (!$finalKode || strlen($finalKode) < 10) return null;

        // 2. Ekstrak Kode Kab & Kec
        $kabCode = substr($finalKode, 2, 2);
        $kecCode = substr($finalKode, 4, 3);

        // 3. Pastikan Kabupaten Ada
        $kabupaten = Kabupaten::whereRaw('LOWER(nama) = ?', [strtolower($namaKab)])->first();
        if (!$kabupaten) {
            $kabupaten = Kabupaten::create([
                'provinsi_id' => 73, // Sulsel
                'kode'        => $kabCode,
                'nama'        => strtoupper($namaKab),
            ]);
        }

        // 4. Pastikan Kecamatan Ada
        $kecamatan = Kecamatan::where('kabupaten_id', $kabupaten->id)
            ->whereRaw('LOWER(nama) = ?', [strtolower($namaKec)])
            ->first();

        if (!$kecamatan) {
            $kecamatan = Kecamatan::create([
                'kabupaten_id' => $kabupaten->id,
                'kode'         => $kecCode,
                'nama'         => strtoupper($namaKec),
            ]);
        }

        // Buat Desa baru
        $desa = Desa::create([
            'kecamatan_id'         => $kecamatan->id,
            'code'                 => $finalKode,
            'kode_desa_kelurahan'  => $finalKode,
            'nama_desa_kelurahan'  => strtoupper($namaDesa),
            'tahun'                => $tahun,
            'geometry'             => null, // Geometri belum tersedia, perlu import shapefile terpisah
        ]);

        return $desa;
    }

    // =========================================================================
    // Load DBF sebagai lookup array [kab|kec|desa] => kode
    // =========================================================================
    private function loadDbfLookup(string $dbfPath): array
    {
        if (!file_exists($dbfPath)) return [];

        $lookup = [];
        try {
            $handle = fopen($dbfPath, 'rb');
            if (!$handle) return [];

            // Read header
            fseek($handle, 4);
            $numRecords = unpack('V', fread($handle, 4))[1];
            $headerSize = unpack('v', fread($handle, 2))[1];
            $recordSize = unpack('v', fread($handle, 2))[1];

            // Read field descriptors
            fseek($handle, 32);
            $fields = [];
            while (true) {
                $fd = fread($handle, 32);
                if (!$fd || ord($fd[0]) === 13) break;
                $name   = rtrim(substr($fd, 0, 11), "\x00");
                $type   = $fd[11];
                $length = ord($fd[16]);
                $fields[] = ['name' => $name, 'length' => $length];
            }

            // Read records
            fseek($handle, $headerSize);
            for ($i = 0; $i < $numRecords; $i++) {
                $recBytes = fread($handle, $recordSize);
                if (!$recBytes || ord($recBytes[0]) === 42) continue; // deleted

                $pos = 1;
                $row = [];
                foreach ($fields as $field) {
                    $val      = substr($recBytes, $pos, $field['length']);
                    $row[$field['name']] = trim($val);
                    $pos += $field['length'];
                }

                // Build lookup key
                $kab  = strtolower($row['NAMA_KAB']  ?? '');
                $kec  = strtolower($row['NAMA_KEC']  ?? '');
                $desa = strtolower($row['NAMA_DESA'] ?? '');
                $kode = $row['IDDESA'] ?? '';

                if ($kab && $kec && $desa && $kode) {
                    $lookup["{$kab}|{$kec}|{$desa}"] = ['kode' => $kode];
                }
            }
            fclose($handle);
        } catch (\Exception $e) {
            // Jika DBF tidak bisa dibaca, lanjut tanpa lookup
        }

        return $lookup;
    }

    // =========================================================================
    // HELPERS
    // =========================================================================
    private function findKeyExact(array $keys, array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            foreach ($keys as $key) {
                if (strtolower(trim($key)) === strtolower(trim($candidate))) return $key;
            }
        }
        return null;
    }

    private function findKeyContains(array $keys, array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            $lower = strtolower($candidate);
            foreach ($keys as $key) {
                if (str_contains(strtolower($key), $lower)) return $key;
            }
        }
        return null;
    }

    private function parseFloat(array $line, ?string $key): ?float
    {
        if (!$key || !array_key_exists($key, $line) || $line[$key] === null || $line[$key] === '') return null;
        return is_numeric($line[$key]) ? floatval($line[$key]) : null;
    }

    private function cleanName(string $name): string
    {
        $name = strtoupper(trim($name));
        $name = preg_replace('/^(DESA|KELURAHAN|KAB\.|KABUPATEN|KOTA|KECAMATAN)\s+/i', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return trim($name);
    }

    // =========================================================================
    // FOTO KANTOR
    // =========================================================================
    public function uploadFotoKantor(Request $request, $id)
    {
        $request->validate(['foto' => 'required|image|mimes:jpeg,png,jpg,webp|max:51200']);

        $desa = Desa::findOrFail($id);

        if ($request->hasFile('foto')) {
            if ($desa->foto_kantor) {
                $oldPath = str_replace('/storage/', '', $desa->foto_kantor);
                if (Storage::disk('public')->exists($oldPath)) Storage::disk('public')->delete($oldPath);
            }

            $file     = $request->file('foto');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path     = $file->storeAs('foto_kantor', $filename, 'public');

            $desa->foto_kantor = '/storage/' . $path;
            $desa->save();

            return response()->json(['message' => 'Foto berhasil diunggah', 'foto_kantor' => $desa->foto_kantor]);
        }

        return response()->json(['message' => 'Tidak ada file yang diunggah'], 400);
    }

    public function deleteFotoKantor($id)
    {
        $desa = Desa::findOrFail($id);

        if ($desa->foto_kantor) {
            $oldPath = str_replace('/storage/', '', $desa->foto_kantor);
            if (Storage::disk('public')->exists($oldPath)) Storage::disk('public')->delete($oldPath);

            $desa->foto_kantor = null;
            $desa->save();

            return response()->json(['message' => 'Foto berhasil dihapus']);
        }

        return response()->json(['message' => 'Foto tidak ditemukan'], 404);
    }
}
