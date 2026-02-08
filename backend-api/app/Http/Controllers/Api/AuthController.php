<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user'
        ]);

        // Asignar rol de usuario por defecto
        $userRole = \App\Models\Role::where('name', 'user')->first();
        if ($userRole) {
            $user->assignRole($userRole);
        }

        $token = $user->createToken('auth')->plainTextToken;

        // Cargar roles y permisos
        $user->load('roles.permissions');

        // Obtener permisos únicos
        $permissions = $user->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id')->values();

        return response()->json([
            'user' => $user,
            'token' => $token,
            'roles' => $user->roles,
            'permissions' => $permissions
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth')->plainTextToken;

        // Cargar roles y permisos
        $user->load('roles.permissions');

        // Obtener permisos únicos de todos los roles del usuario
        $permissions = $user->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id')->values();

        return response()->json([
            'user' => $user,
            'token' => $token,
            'roles' => $user->roles,
            'permissions' => $permissions
        ]);
    }

    /**
     * Get current user permissions
     * GET /api/auth/permissions
     */
    public function permissions(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado'
            ], 401);
        }

        $user->load('roles.permissions');

        $permissions = $user->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id')->values();

        return response()->json([
            'success' => true,
            'data' => [
                'roles' => $user->roles,
                'permissions' => $permissions
            ]
        ]);
    }
}
