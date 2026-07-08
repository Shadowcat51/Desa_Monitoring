<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Hanya Admin yang dapat mengakses rute ini.'
            ], 403);
        }

        return $next($request);
    }
}
