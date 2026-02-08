<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /api/roles
     */
    public function index()
    {
        $roles = Role::with('permissions')->where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * POST /api/roles
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:roles|max:255',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'is_active' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rol creado exitosamente',
            'data' => $role->load('permissions')
        ], 201);
    }

    /**
     * Display the specified resource.
     * GET /api/roles/{id}
     */
    public function show($id)
    {
        $role = Role::with('permissions', 'users')->find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $role
        ]);
    }

    /**
     * Update the specified resource in storage.
     * PUT /api/roles/{id}
     */
    public function update(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado'
            ], 404);
        }

        // Proteger el rol super_admin
        if ($role->name === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'No se puede modificar el rol Super Admin'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|unique:roles,name,' . $id . '|max:255',
            'display_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $role->update($request->only(['name', 'display_name', 'description', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Rol actualizado exitosamente',
            'data' => $role->load('permissions')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /api/roles/{id}
     */
    public function destroy($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado'
            ], 404);
        }

        // Proteger roles del sistema
        if (in_array($role->name, ['super_admin', 'admin', 'trainer', 'user'])) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden eliminar roles del sistema'
            ], 403);
        }

        // Soft delete: desactivar en lugar de eliminar
        $role->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Rol desactivado exitosamente'
        ]);
    }

    /**
     * Assign permissions to a role
     * POST /api/roles/{id}/permissions
     */
    public function assignPermissions(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Sync permissions (reemplaza todos)
        $role->permissions()->sync($request->permission_ids);

        return response()->json([
            'success' => true,
            'message' => 'Permisos asignados exitosamente',
            'data' => $role->load('permissions')
        ]);
    }

    /**
     * Remove a specific permission from a role
     * DELETE /api/roles/{roleId}/permissions/{permissionId}
     */
    public function revokePermission($roleId, $permissionId)
    {
        $role = Role::find($roleId);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado'
            ], 404);
        }

        $permission = Permission::find($permissionId);

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no encontrado'
            ], 404);
        }

        $role->permissions()->detach($permissionId);

        return response()->json([
            'success' => true,
            'message' => 'Permiso revocado exitosamente',
            'data' => $role->load('permissions')
        ]);
    }
}
