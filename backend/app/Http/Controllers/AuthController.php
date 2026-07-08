<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Mail\LoginVerificationMail;
use App\Mail\ForgotPasswordCodeMail;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            
            // Check if user is verified
            if (!$user->is_active) {
                Auth::logout();
                return response()->json([
                    'message' => 'Akun belum diverifikasi. Silakan periksa email Anda.'
                ], 403);
            }
            
            // Generate 6-digit code
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store code in database with 10 mins expiry
            $user->login_verification_code = $code;
            $user->login_verification_expires_at = Carbon::now()->addMinutes(10);
            $user->save();

            // Send Email
            Mail::to($user->email)->send(new LoginVerificationMail($code));

            // Log out the user for now until they verify the code
            Auth::logout();

            return response()->json([
                'status' => 'verification_required',
                'message' => 'Kode verifikasi telah dikirim ke email Anda',
                'email' => $user->email
            ]);
        }

        return response()->json([
            'message' => 'Invalid login details'
        ], 401);
    }

    public function verifyLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak terdaftar'], 404);
        }

        // Check if code is empty or expired
        if (!$user->login_verification_code || Carbon::now()->greaterThan($user->login_verification_expires_at)) {
            return response()->json(['message' => 'Kode verifikasi kedaluwarsa atau tidak valid. Silakan minta kode baru.'], 400);
        }

        if ($user->login_verification_code !== $request->code) {
            return response()->json(['message' => 'Kode verifikasi salah'], 400);
        }

        // Code is correct, clear it
        $user->login_verification_code = null;
        $user->login_verification_expires_at = null;
        
        // Set user to online and update last login
        $user->is_online = true;
        $user->last_login_at = now();
        $user->save();

        // Issue token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak terdaftar'], 404);
        }

        // Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store code in database with 10 mins expiry
        $user->login_verification_code = $code;
        $user->login_verification_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Send Email
        Mail::to($user->email)->send(new LoginVerificationMail($code));

        return response()->json([
            'message' => 'Kode verifikasi baru telah dikirim ke email Anda'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Update logout status
        if ($user) {
            // Delete token for this device
            $user->currentAccessToken()->delete();
            
            // Check if user has other active tokens
            if ($user->tokens()->count() === 0) {
                $user->is_online = false;
                $user->save();
            }
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $exists = User::where('email', $request->email)->exists();

        if ($exists) {
            return response()->json(['message' => 'Email terdaftar', 'exists' => true]);
        }

        return response()->json(['message' => 'Email tidak terdaftar', 'exists' => false], 404);
    }

    public function forgotPasswordRequest(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak terdaftar'], 404);
        }

        // Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Use password_reset_tokens table to store the 6-digit code
        // Delete any existing token for this email first
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => $code,
            'created_at' => Carbon::now()
        ]);

        // Send Email
        Mail::to($user->email)->send(new ForgotPasswordCodeMail($code));

        return response()->json([
            'message' => 'Kode verifikasi telah dikirim ke email Anda'
        ]);
    }

    public function forgotPasswordVerify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6'
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->code)
            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Kode verifikasi salah atau sudah kadaluwarsa'], 400);
        }

        // Check if token is older than 10 minutes
        $tokenCreatedAt = Carbon::parse($resetRecord->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) >= 10) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Kode verifikasi sudah kadaluwarsa. Silakan minta kode baru.'], 400);
        }

        return response()->json([
            'message' => 'Kode verifikasi benar. Silakan buat password baru.'
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|min:8|confirmed'
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->code)
            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Kode verifikasi salah atau sudah kadaluwarsa'], 400);
        }

        // Check if token is older than 10 minutes
        $tokenCreatedAt = Carbon::parse($resetRecord->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) >= 10) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Kode verifikasi sudah kadaluwarsa. Silakan minta kode baru.'], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak terdaftar'], 404);
        }

        $user->password = bcrypt($request->password);
        $user->save();

        // Delete token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil diubah. Silakan login kembali.']);
    }
}
