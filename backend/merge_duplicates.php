<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$newDesas = \App\Models\Desa::whereNull('geometry')->with('kecamatan.kabupaten')->get();
$baseDesas = \App\Models\Desa::whereNotNull('geometry')->with('kecamatan.kabupaten')->get();

function slugify($text) {
    $text = strtoupper($text);
    $text = preg_replace('/^(DESA|KELURAHAN|LEMBANG)\s+/', '', $text);
    $text = preg_replace('/[^A-Z0-9]/', '', $text);
    return $text;
}

$merged = 0;
foreach ($newDesas as $new) {
    $newKab = slugify($new->kecamatan->kabupaten->nama ?? '');
    $newKec = slugify($new->kecamatan->nama ?? '');
    $newDesa = slugify($new->nama_desa_kelurahan);

    $found = false;
    foreach ($baseDesas as $base) {
        $baseKab = slugify($base->kecamatan->kabupaten->nama ?? '');
        $baseKec = slugify($base->kecamatan->nama ?? '');
        $baseDesa = slugify($base->nama_desa_kelurahan);

        $kabMatch = (strpos($baseKab, $newKab) !== false || strpos($newKab, $baseKab) !== false);
        $kecMatch = (strpos($baseKec, $newKec) !== false || strpos($newKec, $baseKec) !== false);
        
        $desaMatch = ($baseDesa === $newDesa || levenshtein($baseDesa, $newDesa) <= 2);
        $codeMatch = ($base->code && $new->code && substr($base->code, -6) === substr($new->code, -6));

        if ($kabMatch && $kecMatch && ($desaMatch || $codeMatch)) {
            $found = $base;
            break;
        }
    }

    if ($found) {
        // Move data_podes from $new to $found
        \App\Models\DataPodes::where('desa_id', $new->id)->update(['desa_id' => $found->id]);
        
        // Delete the new desa
        $new->delete();
        $merged++;
        echo "MERGED: {$new->nama_desa_kelurahan} into {$found->nama_desa_kelurahan}\n";
    }
}
echo "Total merged: $merged\n";
