<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password Anda</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #1e293b; margin-top: 0;">Reset Password Akun DesaMonitor</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Halo,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Anda menerima email ini karena kami menerima permintaan untuk mengatur ulang password akun Anda.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetUrl }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Tautan reset password ini akan kedaluwarsa jika tidak digunakan.
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
            Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 14px; text-align: center;">
            &copy; {{ date('Y') }} BPS Provinsi Sulawesi Selatan. Hak Cipta Dilindungi.
        </p>
    </div>
</body>
</html>
