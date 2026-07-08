<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kode Verifikasi Login</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #1e293b; margin-top: 0; text-align: center;">Kode Verifikasi Login</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: center;">
            Gunakan kode 6 digit di bawah ini untuk menyelesaikan proses login Anda ke aplikasi DesaMonitor.
        </p>
        <div style="text-align: center; margin: 40px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; background-color: #e0e7ff; padding: 15px 30px; border-radius: 8px; display: inline-block;">
                {{ $code }}
            </span>
        </div>
        <p style="color: #ef4444; font-size: 14px; line-height: 1.5; text-align: center; font-weight: bold;">
            Kode ini hanya berlaku selama 10 menit.
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; text-align: center;">
            Jika Anda tidak merasa melakukan proses login, abaikan saja email ini atau segera hubungi Administrator Anda.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 14px; text-align: center;">
            &copy; {{ date('Y') }} BPS Provinsi Sulawesi Selatan. Hak Cipta Dilindungi.
        </p>
    </div>
</body>
</html>
