<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserRoleController extends Controller
{
    /**
     * Get all users with their roles
     * GET /api/users/roles
     */
    public function index()
    {
        $users = User::with('roles')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Get roles for a specific user
     * GET /api/users/{userId}/roles
     */
    public function getUserRoles($userId)
    {
        $user = User::with('roles')->find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user->roles
        ]);
    }

    /**
     * Assign role(s) to a user
     * POST /api/users/{userId}/roles
     */
    public function assignRole(Request $request, $userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Sync roles (reemplaza todos los roles del usuario)
        $user->roles()->sync($request->role_ids);

        return response()->json([
            'success' => true,
            'message' => 'Roles asignados exitosamente',
            'data' => $user->load('roles')
        ]);
    }

    /**
     * Remove a specific role from a user
     * DELETE /api/users/{userId}/roles/{roleId}
     */
    public function revokeRole($userId, $roleId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $role = Role::find($roleId);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado'
            ], 404);
        }

        $user->roles()->detach($roleId);

        return response()->json([
            'success' => true,
            'message' => 'Rol revocado exitosamente',
            'data' => $user->load('roles')
        ]);
    }

    /**
     * Get all permissions for a user (through their roles)
     * GET /api/users/{userId}/permissions
     */
    public function getUserPermissions($userId)
    {
        $user = User::with('roles.permissions')->find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        // Recopilar todos los permisos de todos los roles
        $permissions = $user->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id')->values();

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }
}
