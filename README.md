# 🌍 Desa Monitoring System

![Desa Monitoring Banner](https://img.shields.io/badge/Desa-Monitoring-blue?style=for-the-badge) ![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

**Desa Monitoring System** adalah platform web komprehensif yang dirancang untuk memonitor, mengelola, dan memvisualisasikan data desa berbasis geospasial. Sistem ini menggabungkan kekuatan backend Laravel, frontend React modern, dan skrip pemrosesan data geospasial menggunakan Python.

---

## ✨ Fitur Utama

### 🗺️ Visualisasi & Geospasial
*   **Peta Interaktif:** Menampilkan batas desa dan informasi spasial menggunakan **MapLibre GL**.
*   **Data Desa:** Memonitor statistik dan informasi rinci dari berbagai desa.

### 🔐 Manajemen Pengguna & Keamanan
*   **Autentikasi Aman:** Sistem login, pendaftaran, dan verifikasi email.
*   **Role-Based Access Control:** Pengaturan hak akses (Admin & User biasa).
*   **Lupa & Reset Password:** Alur pemulihan akun yang aman menggunakan verifikasi email.

### 🎛️ Dashboard Admin
*   **Manajemen Data (Podes):** Upload, edit, dan perbarui data statistik desa secara dinamis.
*   **User Control:** Pengelolaan pengguna oleh administrator.
*   **Manajemen Media:** Fitur upload dan pemotongan (crop) foto kantor desa dengan UI intuitif.

### 📊 Pipeline Data (Python)
*   **Pemrosesan Shapefile & DBF:** Ekstraksi dan konversi data geospasial `.shp` dan `.dbf`.
*   **ETL Pipeline:** Skrip Python (`etl_pipeline.py`) untuk membersihkan dan menyiapkan data PODES ke dalam database.

---

## 🛠️ Tech Stack

Sistem ini dibangun menggunakan arsitektur modern yang memisahkan frontend, backend, dan proses data:

*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand (State Management), Framer Motion (Animasi), MapLibre GL.
*   **Backend:** Laravel 11 (PHP), RESTful APIs, MySQL/PostgreSQL.
*   **Data Processing:** Python (Pandas, GeoPandas) untuk ETL dan analisis Shapefile.

---

## 🚀 Cara Menjalankan Proyek (Local Development)

### 📋 Prasyarat
Pastikan sistem Anda telah terinstal:
*   **PHP** (v8.2+) & Composer
*   **Node.js** (v18+) & npm/yarn
*   **Python** (v3.9+)
*   **Database** (MySQL / MariaDB / PostgreSQL)

### 1️⃣ Setup Backend (Laravel)
1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Instal dependensi PHP:
   ```bash
   composer install
   ```
3. Konfigurasi Environment:
   * Copy file `.env.example` menjadi `.env`.
   * Sesuaikan konfigurasi database (DB_DATABASE, DB_USERNAME, DB_PASSWORD).
4. Generate Key & Migrasi Database:
   ```bash
   php artisan key:generate
   php artisan migrate --seed
   ```
5. Jalankan server lokal:
   ```bash
   php artisan serve
   ```
   *Backend akan berjalan di `http://127.0.0.1:8000`*

### 2️⃣ Setup Frontend (React + Vite)
1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend-desa-monitoring
   ```
2. Instal dependensi NPM:
   ```bash
   npm install
   ```
3. Konfigurasi Environment:
   * Pastikan URL API backend sudah diatur dengan benar di dalam konfigurasi atau file `.env` frontend.
4. Jalankan development server:
   ```bash
   npm run dev
   ```
   *Frontend akan berjalan di `http://localhost:5173`*

### 3️⃣ Python Data Pipeline (Opsional)
Jika Anda perlu memproses data geospasial atau Podes baru:
1. Aktifkan virtual environment (jika ada):
   ```bash
   venv\Scripts\activate
   ```
2. Jalankan skrip pipeline:
   ```bash
   python etl_pipeline.py
   ```

---

## 📂 Struktur Direktori

```text
📦 Desa_Monitoring
 ┣ 📂 backend/                    # Source code Laravel API & Database Migrations
 ┣ 📂 frontend-desa-monitoring/   # Source code React Vite + Tailwind
 ┣ 📂 data_podes/                 # File raw data (Shapefile, DBF, Excel)
 ┣ 📜 etl_pipeline.py             # Skrip utama ekstraksi data
 ┣ 📜 docker-compose.yml          # Konfigurasi container opsional
 ┗ 📜 .gitignore                  # Mengabaikan file data besar dari repository
```

---
*Dibuat dengan ❤️ untuk kemajuan desa.*
