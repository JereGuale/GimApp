<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

class RolePermissionController extends Controller
{
    /**
     * Get all roles with their permissions
     */
    public function getRoles()
    {
        $roles = Role::with('permissions')->where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * Get all permissions grouped by category
     */
    /**
     * Get all permissions grouped by category
     */
    public function getPermissions()
    {
        $permissions = Permission::where('guard_name', 'sanctum')
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }

    public function getTrainerPermissions()
    {
        // 1. Get the Trainer Role explicitly
        $trainerRole = Role::where('name', 'trainer')->where('guard_name', 'sanctum')->first();

        if (!$trainerRole) {
            return response()->json(['message' => 'Trainer role not found'], 404);
        }

        // 2. Get ALL permissions to build the matrix
        $allPermissions = Permission::where('guard_name', 'sanctum')->get();

        // 3. Get currently assigned permissions for the trainer role
        $assignedPermissions = $trainerRole->permissions;

        // 4. Build a matrix: [permission_id => true/false]
        $matrix = [];
        foreach ($assignedPermissions as $p) {
            $matrix[$p->id] = true;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'permissions' => $allPermissions,
                'trainer_role_id' => $trainerRole->id,
                'permission_matrix' => $matrix
            ]
        ]);
    }

    /**
     * Create a new role
     */
    public function createRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:roles|max:255',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $role = Role::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'is_active' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rol creado exitosamente',
            'data' => $role
        ], 201);
    }

    /**
     * Update a role
     */
    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|unique:roles,name,' . $id . '|max:255',
            'display_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean'
        ]);

        $role->update($request->only(['name', 'display_name', 'description', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Rol actualizado exitosamente',
            'data' => $role
        ]);
    }

    /**
     * Delete a role
     */
    public function deleteRole($id)
    {
        $role = Role::findOrFail($id);

        // Don't allow deletion of system roles
        if (in_array($role->name, ['admin', 'trainer', 'user'])) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden eliminar roles del sistema'
            ], 400);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rol eliminado exitosamente'
        ]);
    }

    /**
     * Assign permission to role
     */
    public function assignPermissionToRole(Request $request, $roleId)
    {
        $request->validate([
            'permission_id' => 'required|exists:permissions,id'
        ]);

        $role = Role::findOrFail($roleId);
        $permission = Permission::findOrFail($request->permission_id);

        $role->givePermission($permission);

        return response()->json([
            'success' => true,
            'message' => 'Permiso asignado al rol exitosamente'
        ]);
    }

    /**
     * Remove permission from role
     */
    public function removePermissionFromRole(Request $request, $roleId)
    {
        $request->validate([
            'permission_id' => 'required|exists:permissions,id'
        ]);

        $role = Role::findOrFail($roleId);
        $permission = Permission::findOrFail($request->permission_id);

        $role->revokePermission($permission);

        return response()->json([
            'success' => true,
            'message' => 'Permiso removido del rol exitosamente'
        ]);
    }

    /**
     * Sync all permissions for a role
     */
    public function syncRolePermissions(Request $request, $roleId)
    {
        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        $role = Role::findOrFail($roleId);
        $role->permissions()->sync($request->permission_ids);

        return response()->json([
            'success' => true,
            'message' => 'Permisos del rol actualizados exitosamente',
            'data' => $role->load('permissions')
        ]);
    }

    /**
     * Assign role to user
     */
    public function assignRoleToUser(Request $request, $userId)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id'
        ]);

        $user = User::findOrFail($userId);
        $role = Role::findOrFail($request->role_id);

        $user->assignRole($role);

        return response()->json([
            'success' => true,
            'message' => 'Rol asignado al usuario exitosamente'
        ]);
    }

    /**
     * Remove role from user
     */
    public function removeRoleFromUser(Request $request, $userId)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id'
        ]);

        $user = User::findOrFail($userId);
        $role = Role::findOrFail($request->role_id);

        $user->removeRole($role);

        return response()->json([
            'success' => true,
            'message' => 'Rol removido del usuario exitosamente'
        ]);
    }

    /**
     * Get user's permissions
     */
    public function getUserPermissions($userId)
    {
        $user = User::with('roles.permissions')->findOrFail($userId);

        $permissions = [];
        foreach ($user->roles as $role) {
            foreach ($role->permissions as $permission) {
                if (!in_array($permission->name, array_column($permissions, 'name'))) {
                    $permissions[] = $permission;
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }
}
