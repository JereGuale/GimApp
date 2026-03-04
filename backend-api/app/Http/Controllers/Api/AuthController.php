<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

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

        $userRole = \App\Models\Role::where('name', 'user')->first();
        if ($userRole) {
            $user->assignRole($userRole);
        }

        $token = $user->createToken('auth')->plainTextToken;
        $user->load('roles.permissions');
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
        $user->load('roles.permissions');
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

    public function permissions(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'No autenticado'], 401);
        }
        $user->load('roles.permissions');
        $permissions = $user->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id')->values();

        return response()->json(['success' => true, 'data' => ['roles' => $user->roles, 'permissions' => $permissions]]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permissions');
        return response()->json([
            'success' => true,
            'user' => $user,
            'profile_photo_url' => $user->profile_photo_url
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);
        $user->update($validated);
        return response()->json(['success' => true, 'message' => 'Perfil actualizado exitosamente', 'user' => $user]);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:5120']);

        $user = $request->user();
        $ext = $request->file('photo')->getClientOriginalExtension();
        $fileName = 'profile_' . $user->id . '_' . time() . '.' . $ext;

        try {
            // Upload to Supabase Storage
            Storage::disk('supabase')->putFileAs('profile_photos', $request->file('photo'), $fileName, 'public');
            $photoUrl = Storage::disk('supabase')->url('profile_photos/' . $fileName);
        } catch (\Exception $e) {
            Log::error('Supabase photo upload failed: ' . $e->getMessage());
            // Fallback to local
            $path = $request->file('photo')->storeAs('profile_photos', $fileName, 'public');
            $photoUrl = Storage::disk('public')->url($path);
        }

        $user->update(['profile_photo' => $photoUrl]);

        return response()->json([
            'success' => true,
            'message' => 'Foto de perfil actualizada',
            'profile_photo' => $photoUrl,
            'profile_photo_url' => $photoUrl
        ]);
    }
}