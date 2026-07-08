<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\PasswordResetMail;

class AccountSettingsController extends Controller
{
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'no_telp' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->no_telp = $request->no_telp;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    public function updatePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            // Store new photo
            $path = $request->file('photo')->store('profile-photos', 'public');
            
            $user->profile_photo_path = $path;
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Profile photo updated successfully',
                'user' => $user
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'No photo provided'
        ], 400);
    }

    public function requestPasswordReset(Request $request)
    {
        $user = $request->user();

        // Check if token already exists
        $existingToken = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->first();

        if ($existingToken) {
            $tokenCreatedAt = Carbon::parse($existingToken->created_at);
            $now = Carbon::now();
            
            // If token is less than 1 hour old (60 minutes)
            if ($now->diffInMinutes($tokenCreatedAt) < 60) {
                // Token exists and still valid, don't resend
                return response()->json([
                    'status' => 'already_sent',
                    'message' => 'Link Ganti Password sudah dikirim sebelumnya silahkan cek email'
                ]);
            } else {
                // Token expired, delete the old one
                DB::table('password_reset_tokens')
                    ->where('email', $user->email)
                    ->delete();
            }
        }

        // Generate new token
        $token = Str::random(64);
        
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => $token,
            'created_at' => Carbon::now()
        ]);

        // Send email
        Mail::to($user->email)->send(new PasswordResetMail($token, $user->email));

        return response()->json([
            'status' => 'success',
            'message' => 'Password reset link sent to your email'
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid password reset link'
            ], 400);
        }

        // Check expiration (1 hour)
        $tokenCreatedAt = Carbon::parse($resetRecord->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) >= 60) {
            // Delete expired token
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            
            return response()->json([
                'status' => 'error',
                'message' => 'Link reset password sudah kedaluwarsa. Silakan request link baru.'
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Password has been reset successfully'
        ]);
    }
}
