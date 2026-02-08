<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /api/permissions
     */
    public function index(Request $request)
    {
        $query = Permission::where('is_active', true);

        // Filtrar por categoría si se proporciona
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $permissions = $query->orderBy('category')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }

    /**
     * Get permissions grouped by category
     * GET /api/permissions/grouped
     */
    public function grouped()
    {
        $permissions = Permission::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * POST /api/permissions
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:permissions|max:255',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $permission = Permission::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'category' => $request->category ?? 'general',
            'is_active' => true
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permiso creado exitosamente',
            'data' => $permission
        ], 201);
    }

    /**
     * Display the specified resource.
     * GET /api/permissions/{id}
     */
    public function show($id)
    {
        $permission = Permission::with('roles')->find($id);

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $permission
        ]);
    }

    /**
     * Update the specified resource in storage.
     * PUT /api/permissions/{id}
     */
    public function update(Request $request, $id)
    {
        $permission = Permission::find($id);

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|unique:permissions,name,' . $id . '|max:255',
            'display_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $permission->update($request->only(['name', 'display_name', 'description', 'category', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'Permiso actualizado exitosamente',
            'data' => $permission
        ]);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /api/permissions/{id}
     */
    public function destroy($id)
    {
        $permission = Permission::find($id);

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no encontrado'
            ], 404);
        }

        // Soft delete: desactivar en lugar de eliminar
        $permission->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Permiso desactivado exitosamente'
        ]);
    }
}
