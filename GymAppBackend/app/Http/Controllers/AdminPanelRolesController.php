<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AdminPanelRolesController extends Controller
{
    // Listar todos los usuarios y sus roles
    public function listUsers()
    {
        // Log de autenticación y headers
        \Log::info('[listUsers] Auth user:', ['id' => optional(auth()->user())->id, 'email' => optional(auth()->user())->email, 'roles' => optional(auth()->user())->getRoleNames()]);
        \Log::info('[listUsers] Headers:', request()->headers->all());

        $users = User::with('roles')->get();
        return response()->json($users);
    }

    // Listar todos los roles disponibles
    public function listRoles()
    {
        $roles = Role::where('is_active', true)->get();
        return response()->json($roles);
    }

    // Cambiar el rol de un usuario (solo super_admin, no a sí mismo)
    public function changeUserRole(Request $request, User $user)
    {
        $authUser = Auth::user();
        if (!$authUser->hasRole('super_admin')) {
            return response()->json(['error' => 'No autorizado'], 403);
        }
        if ($authUser->id === $user->id) {
            return response()->json(['error' => 'No puedes cambiar tu propio rol'], 403);
        }
        $validator = Validator::make($request->all(), [
            'role' => 'required|exists:roles,name'
        ]);
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }
        $user->syncRoles([$request->role]);
        return response()->json(['success' => true, 'user' => $user->fresh('roles')]);
    }

    // (Opcional) Listar matriz de permisos por rol
    public function rolesPermissionsMatrix()
    {
        $roles = Role::with('permissions')->where('is_active', true)->get();
        return response()->json($roles);
    }
}
