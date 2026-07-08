<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use App\Mail\VerifyUserAccount;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::leftJoin('kabupatens', 'users.assigned_kabupaten_id', '=', 'kabupatens.id')
            ->select('users.*', 'kabupatens.nama as kabupaten_nama')
            ->orderBy('users.created_at', 'desc')
            ->get();
            
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email|ends_with:@bps.go.id',
            'no_telp' => 'nullable|string|max:15',
            'role' => 'required|in:super_admin,admin_prov,admin_kab,pegawai',
            'kabupaten' => 'nullable|exists:kabupatens,id'
        ]);

        // Determine username from email (e.g. jhon@bps.go.id -> jhon)
        $username = explode('@', $request->email)[0];
        
        // Handle Kabupaten Logic
        $kabupatenId = $request->kabupaten;
        if (in_array($request->role, ['super_admin', 'admin_prov'])) {
            $kabupatenId = null;
        }

        // Create the user (unverified by default)
        $user = User::create([
            'name' => $username,
            'email' => $request->email,
            'password' => Hash::make('bps7300'),
            'role' => $request->role,
            'no_telp' => $request->no_telp,
            'assigned_kabupaten_id' => $kabupatenId,
            'is_active' => false, // explicitly false to wait for verification
        ]);

        // Generate Signed Verification URL in Backend
        $backendVerifyUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addHours(24),
            ['id' => $user->id]
        );

        // Map to Frontend Route
        $frontendUrl = 'http://localhost:5173/verify-email?verify_url=' . urlencode($backendVerifyUrl);

        // Send Email
        Mail::to($user->email)->send(new VerifyUserAccount($user, $frontendUrl));

        return response()->json([
            'message' => 'Akun berhasil dibuat. Email verifikasi telah dikirim.',
            'user' => $user
        ], 201);
    }

    public function verifyEmail(Request $request, $id)
    {
        if (!$request->hasValidSignature()) {
            return response()->json(['message' => 'Link verifikasi tidak valid atau sudah kedaluwarsa.'], 400);
        }

        $user = User::findOrFail($id);

        if ($user->is_active && $user->email_verified_at) {
            return response()->json(['message' => 'Akun sudah diverifikasi sebelumnya.'], 200);
        }

        $user->is_active = true;
        $user->email_verified_at = now();
        $user->save();

        return response()->json(['message' => 'Akun Anda telah berhasil diverifikasi.']);
    }

    public function kabupatens()
    {
        return response()->json(\App\Models\Kabupaten::all());
    }

    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:super_admin,admin_prov,admin_kab,pegawai',
            'kabupaten' => 'nullable|exists:kabupatens,id'
        ]);

        $user = User::findOrFail($id);
        
        // Prevent changing own role if it's the current user (optional safeguard, but we'll assume frontend prevents this or admin knows what they're doing)
        
        $user->role = $request->role;
        
        // Handle Kabupaten Logic if role changes to super_admin or admin_prov
        $kabupatenId = $request->kabupaten;
        if (in_array($request->role, ['super_admin', 'admin_prov'])) {
            $kabupatenId = null;
        }
        $user->assigned_kabupaten_id = $kabupatenId;

        $user->save();

        return response()->json(['message' => 'Role berhasil diperbarui.', 'user' => $user]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Pengguna berhasil dihapus.']);
    }
}
