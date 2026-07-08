<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;

Route::middleware('throttle:5,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-login', [AuthController::class, 'verifyLogin']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    Route::post('/password/forgot-request', [AuthController::class, 'forgotPasswordRequest']);
    Route::post('/password/forgot-verify', [AuthController::class, 'forgotPasswordVerify']);
    Route::post('/password/forgot-reset', [AuthController::class, 'resetPassword']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Account Settings Routes (accessible by all roles)
    Route::put('/admin/profile', [\App\Http\Controllers\Api\AccountSettingsController::class, 'updateProfile']);
    Route::post('/admin/profile/photo', [\App\Http\Controllers\Api\AccountSettingsController::class, 'updatePhoto']);
    Route::post('/admin/password/request-reset', [\App\Http\Controllers\Api\AccountSettingsController::class, 'requestPasswordReset']);
});

Route::get('/peta/desa', [\App\Http\Controllers\Api\MapController::class, 'index']);
Route::get('/peta/labels', [\App\Http\Controllers\Api\MapController::class, 'labels']);




Route::middleware(['auth:sanctum', \App\Http\Middleware\CheckAdminRole::class])->group(function () {
    Route::get('/admin/podes', [\App\Http\Controllers\Api\AdminPodesController::class, 'index']);
    Route::get('/admin/podes/years', [\App\Http\Controllers\Api\AdminPodesController::class, 'years']);
    Route::post('/admin/podes/upload', [\App\Http\Controllers\Api\AdminPodesController::class, 'uploadData']);
    Route::put('/admin/podes/{id}', [\App\Http\Controllers\Api\AdminPodesController::class, 'updateSingle']);
    Route::post('/admin/podes/{id}/foto', [\App\Http\Controllers\Api\AdminPodesController::class, 'uploadFotoKantor']);
    Route::delete('/admin/podes/{id}/foto', [\App\Http\Controllers\Api\AdminPodesController::class, 'deleteFotoKantor']);
    Route::get('/admin/users', [\App\Http\Controllers\Api\AdminUserController::class, 'index']);
    Route::post('/admin/users', [\App\Http\Controllers\Api\AdminUserController::class, 'store']);
    Route::put('/admin/users/{id}/role', [\App\Http\Controllers\Api\AdminUserController::class, 'updateRole']);
    Route::delete('/admin/users/{id}', [\App\Http\Controllers\Api\AdminUserController::class, 'destroy']);
    Route::get('/admin/kabupatens', [\App\Http\Controllers\Api\AdminUserController::class, 'kabupatens']);
});

// Password Reset Route (Public)
Route::post('/admin/password/reset', [\App\Http\Controllers\Api\AccountSettingsController::class, 'resetPassword']);

// Email verification route (public, but signed)
Route::get('/verify-email/{id}', [\App\Http\Controllers\Api\AdminUserController::class, 'verifyEmail'])->name('verification.verify');
