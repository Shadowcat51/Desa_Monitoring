<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$desa = DB::table('desas')->where('nama_desa_kelurahan', 'A BULOSIBATANG')->first();
echo json_encode($desa) . "\n";
if ($desa) {
    echo json_encode(DB::table('data_podes')->where('desa_id', $desa->id)->get());
}
