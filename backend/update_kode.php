<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$affected = 0;
echo "Peringatan: Script ini sebelumnya menghapus kode BPS dengan REPLACE(code, '.', '').\n";
echo "Silakan gunakan php artisan db:seed --class=DesaSeeder atau script fix_kode.php yang baru jika ingin mereset.\n";
