<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Accept Spatie super_admin role OR users with role column = admin/super_admin
        $hasAccess = $user && (
            $user->isSuperAdmin() ||
            in_array($user->role, ['admin', 'super_admin'])
        );

        if (!$hasAccess) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
