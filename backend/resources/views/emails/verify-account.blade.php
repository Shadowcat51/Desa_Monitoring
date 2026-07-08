<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verifikasi Akun</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f7f6; color: #333; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #1e40af; text-align: center;">Selamat Datang, {{ $user->name }}!</h2>
        <p style="font-size: 16px; line-height: 1.6;">
            Akun Anda untuk <strong>Sistem Monitoring Desa - BPS Provinsi Sulawesi Selatan</strong> telah dibuat oleh Super Admin.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
            Berikut adalah detail akun Anda:
        </p>
        <ul style="font-size: 16px; background: #f8fafc; padding: 15px 30px; border-radius: 6px; list-style-type: none; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Email:</strong> {{ $user->email }}</li>
            <li style="margin-bottom: 8px;"><strong>Username:</strong> {{ $user->name }}</li>
            <li><strong>Password:</strong> bps7300</li>
        </ul>
        
        <p style="font-size: 16px; line-height: 1.6; margin-top: 25px;">
            Namun, sebelum dapat menggunakan akun ini untuk login, Anda diwajibkan untuk memverifikasi alamat email ini. Silakan klik tombol di bawah ini untuk verifikasi:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $verificationUrl }}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Verifikasi Akun Sekarang
            </a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 30px;">
            Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:<br>
            <a href="{{ $verificationUrl }}" style="color: #2563eb; word-break: break-all;">{{ $verificationUrl }}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center;">
            &copy; {{ date('Y') }} BPS Provinsi Sulawesi Selatan. Pesan ini dikirim secara otomatis, mohon tidak membalas pesan ini.
        </p>
    </div>
</body>
</html>
