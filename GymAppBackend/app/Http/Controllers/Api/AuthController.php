<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SupabaseStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:40',
            'username' => 'required|string|max:50|unique:users,username|alpha_dash',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'username' => $validated['username'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'user',
            'phone'    => $request->input('phone'),
        ]);

        $userRole = \App\Models\Role::where('name', 'user')->first();
        if ($userRole)
            $user->assignRole($userRole);

        $token = $user->createToken('auth')->plainTextToken;
        $user->load('roles.permissions');
        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->unique('id')->values();

        return response()->json([
            'user' => $user, 'token' => $token,
            'roles' => $user->roles, 'permissions' => $permissions
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string'
        ]);

        // Buscar por email O por username (para login de cliente)
        $identifier = $validated['email'];
        $user = filter_var($identifier, FILTER_VALIDATE_EMAIL)
            ? User::where('email', $identifier)->first()
            : User::where('username', $identifier)->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!$user->is_active || ($user->suspended_until && $user->suspended_until->isFuture())) {
            $message = 'Cuenta suspendida o inactiva. Contacta al administrador.';
            if ($user->suspended_until && $user->suspended_until->isFuture()) {
                $formattedDate = $user->suspended_until->timezone('America/Bogota')->format('d/m/Y H:i');
                $message = "Tu cuenta ha sido suspendida temporalmente hasta el {$formattedDate}. Contacta al administrador.";
            }
            return response()->json(['message' => $message], 403);
        }

        $token = $user->createToken('auth')->plainTextToken;
        $user->load('roles.permissions');
        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->unique('id')->values();

        return response()->json([
            'user' => $user, 'token' => $token,
            'roles' => $user->roles, 'permissions' => $permissions
        ]);
    }

    public function googleAuth(Request $request)
    {
        $idToken = $request->input('id_token') ?: $request->input('token');
        $email = $request->input('email');
        $name = $request->input('name');
        $googleId = $request->input('google_id') ?: $request->input('sub');
        $picture = $request->input('photo') ?: $request->input('avatar') ?: $request->input('picture');

        // Si se envía id_token, verificarlo directamente con Google
        if ($idToken) {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(6)->get("https://oauth2.googleapis.com/tokeninfo", [
                    'id_token' => $idToken,
                ]);

                if ($response->successful()) {
                    $googleData = $response->json();
                    $email = $googleData['email'] ?? $email;
                    $name = $googleData['name'] ?? $name;
                    $googleId = $googleData['sub'] ?? $googleId;
                    $picture = $googleData['picture'] ?? $picture;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Google id_token verification fallback: ' . $e->getMessage());
            }
        }

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo obtener el correo de la cuenta de Google.'
            ], 422);
        }

        // Buscar si ya existe el usuario por google_id o por email
        $user = null;
        if ($googleId) {
            $user = User::where('google_id', $googleId)->first();
        }
        if (!$user) {
            $user = User::where('email', $email)->first();
        }

        if ($user) {
            // Verificar si la cuenta está suspendida o inactiva
            if (!$user->is_active || ($user->suspended_until && $user->suspended_until->isFuture())) {
                $message = 'Cuenta suspendida o inactiva. Contacta al administrador.';
                if ($user->suspended_until && $user->suspended_until->isFuture()) {
                    $formattedDate = $user->suspended_until->timezone('America/Bogota')->format('d/m/Y H:i');
                    $message = "Tu cuenta ha sido suspendida temporalmente hasta el {$formattedDate}. Contacta al administrador.";
                }
                return response()->json(['message' => $message], 403);
            }

            // Actualizar google_id o foto si no los tenía
            $updates = [];
            if (!$user->google_id && $googleId) {
                $updates['google_id'] = $googleId;
            }
            if (!$user->profile_photo && $picture) {
                $updates['profile_photo'] = $picture;
            }
            if (!empty($updates)) {
                $user->update($updates);
            }
        } else {
            // Generar un username único basado en el email o nombre
            $baseUsername = \Illuminate\Support\Str::slug(explode('@', $email)[0], '_');
            if (empty($baseUsername)) {
                $baseUsername = 'user_' . rand(1000, 9999);
            }
            $usernameCandidate = $baseUsername;
            $counter = 1;
            while (User::where('username', $usernameCandidate)->exists()) {
                $usernameCandidate = $baseUsername . '_' . rand(100, 999);
                $counter++;
                if ($counter > 10) {
                    $usernameCandidate = 'user_' . time();
                    break;
                }
            }

            // Crear el nuevo usuario
            $user = User::create([
                'name'          => $name ?: explode('@', $email)[0],
                'username'      => $usernameCandidate,
                'email'         => $email,
                'google_id'     => $googleId,
                'role'          => 'user',
                'profile_photo' => $picture,
                'is_active'     => true,
            ]);

            $userRole = \App\Models\Role::where('name', 'user')->first();
            if ($userRole) {
                $user->assignRole($userRole);
            }
        }

        $token = $user->createToken('auth')->plainTextToken;
        $user->load('roles.permissions');
        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->unique('id')->values();

        return response()->json([
            'success'     => true,
            'user'        => $user,
            'token'       => $token,
            'roles'       => $user->roles,
            'permissions' => $permissions
        ], 200);
    }

    public function permissions(Request $request)
    {
        $user = $request->user();
        if (!$user)
            return response()->json(['success' => false, 'message' => 'No autenticado'], 401);
        $user->load('roles.permissions');
        $permissions = $user->roles->flatMap(fn($r) => $r->permissions)->unique('id')->values();
        return response()->json(['success' => true, 'data' => ['roles' => $user->roles, 'permissions' => $permissions]]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permissions');
        return response()->json(['success' => true, 'user' => $user, 'profile_photo_url' => $user->profile_photo_url]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'username' => 'sometimes|nullable|string|max:50|alpha_dash|unique:users,username,' . $user->id,
            'phone' => 'sometimes|nullable|string|max:20',
            'billing_name' => 'sometimes|nullable|string|max:255',
            'billing_email' => 'sometimes|nullable|email',
            'billing_phone' => 'sometimes|nullable|string|max:20',
            'billing_id_number' => 'sometimes|nullable|string|max:30',
            'billing_city' => 'sometimes|nullable|string|max:100',
            'billing_address' => 'sometimes|nullable|string',
        ], [
            'username.unique' => 'Este nombre de usuario ya está registrado por otra cuenta.',
            'username.alpha_dash' => 'El nombre de usuario no debe contener espacios ni caracteres especiales (solo letras, números, _ o -).',
            'username.max' => 'El nombre de usuario no puede superar los 50 caracteres.',
            'billing_email.email' => 'El correo de facturación debe ser un correo válido.',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $user->name) {
            if ($user->name_changed_at && now()->diffInDays($user->name_changed_at) < 60) {
                $daysPassed = (int)now()->diffInDays($user->name_changed_at);
                $daysRemaining = max(1, 60 - $daysPassed);
                return response()->json([
                    'success' => false,
                    'error' => "No puedes cambiar tu nombre todavía. Debes esperar {$daysRemaining} día(s) más (el cambio se permite una vez cada 60 días)."
                ], 422);
            }
            $validated['name_changed_at'] = now();
        }

        if (isset($validated['username']) && $validated['username'] !== $user->username) {
            if ($user->username_changed_at && now()->diffInDays($user->username_changed_at) < 60) {
                $daysPassed = (int)now()->diffInDays($user->username_changed_at);
                $daysRemaining = max(1, 60 - $daysPassed);
                return response()->json([
                    'success' => false,
                    'error' => "No puedes cambiar tu nombre de usuario todavía. Debes esperar {$daysRemaining} día(s) más (el cambio se permite una vez cada 60 días)."
                ], 422);
            }
            $validated['username_changed_at'] = now();
        }

        $user->update($validated);
        return response()->json(['success' => true, 'message' => 'Perfil actualizado exitosamente', 'user' => $user]);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:5120']);
        $user = $request->user();

        $ext = $request->file('photo')->getClientOriginalExtension();
        $fileName = 'profile_' . $user->id . '_' . time() . '.' . $ext;
        $filePath = 'profile_photos/' . $fileName;

        $supabase = new SupabaseStorage();
        if ($supabase->isConfigured()) {
            $photoUrl = $supabase->uploadFile($request->file('photo'), $filePath);
        }

        if (empty($photoUrl)) {
            // Fallback to local storage
            $request->file('photo')->storeAs('profile_photos', $fileName, 'public');
            $appUrl = rtrim(config('app.url', 'https://gimapp.onrender.com'), '/');
            $photoUrl = $appUrl . '/storage/' . $filePath;
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