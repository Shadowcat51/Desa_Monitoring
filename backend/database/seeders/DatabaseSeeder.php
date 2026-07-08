<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Kabupaten;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Get all kabupatens to assign randomly to admin_kab and pegawai
        $kabupatens = Kabupaten::all();
        $randomKab1 = $kabupatens->count() > 0 ? $kabupatens->random()->id : null;
        $randomKab2 = $kabupatens->count() > 0 ? $kabupatens->random()->id : null;
        $randomKab3 = $kabupatens->count() > 0 ? $kabupatens->random()->id : null;

        function randomPhone() {
            return '08' . mt_rand(100000000, 999999999);
        }

        // Superadmin: No kab/kota assigned explicitly, frontend will handle rendering as "Provinsi Sulawesi Selatan"
        User::updateOrCreate(['email' => 'superadmin@test.com'], [
            'name' => 'Super Admin',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
            'is_active' => true,
            'no_telp' => randomPhone(),
            'assigned_kabupaten_id' => null,
            'last_login_at' => now()->subHours(2),
        ]);

        // Admin Provinsi: Also handled in frontend
        User::updateOrCreate(['email' => 'admin@test.com'], [
            'name' => 'Admin Provinsi',
            'password' => bcrypt('password'),
            'role' => 'admin_prov',
            'is_active' => true,
            'no_telp' => randomPhone(),
            'assigned_kabupaten_id' => null,
            'last_login_at' => now()->subHours(24),
        ]);

        // Admin Kabupaten
        User::updateOrCreate(['email' => 'adminkab@test.com'], [
            'name' => 'Admin Kabupaten',
            'password' => bcrypt('password'),
            'role' => 'admin_kab',
            'is_active' => true,
            'no_telp' => randomPhone(),
            'assigned_kabupaten_id' => $randomKab1,
            'last_login_at' => now()->subHours(5),
        ]);

        // Pegawai
        User::updateOrCreate(['email' => 'pegawai1@test.com'], [
            'name' => 'Pegawai Satu',
            'password' => bcrypt('password'),
            'role' => 'pegawai',
            'is_active' => true,
            'no_telp' => randomPhone(),
            'assigned_kabupaten_id' => $randomKab2,
            'last_login_at' => now()->subHours(10),
        ]);

        User::updateOrCreate(['email' => 'pegawai2@test.com'], [
            'name' => 'Pegawai Dua',
            'password' => bcrypt('password'),
            'role' => 'pegawai',
            'is_active' => false, // Set to false to test Unverified tab
            'no_telp' => randomPhone(),
            'assigned_kabupaten_id' => $randomKab3,
            'last_login_at' => null, // Belum diverifikasi, belum pernah login
        ]);
    }
}
