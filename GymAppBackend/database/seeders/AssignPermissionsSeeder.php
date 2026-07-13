<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class AssignPermissionsSeeder extends Seeder
{
    /**
     * Assign permissions to existing roles.
     *
     * This seeder assigns appropriate permissions to each role.
     */
    public function run(): void
    {
        // Get all roles
        $superAdmin = Role::where('name', 'super_admin')->first();
        $admin = Role::where('name', 'admin')->first();
        $user = Role::where('name', 'user')->first();

        if (!$superAdmin || !$admin || !$user) {
            $this->command->error('❌ Roles no encontrados. Ejecuta RoleSeeder primero.');
            return;
        }

        // Get all permissions
        $allPermissions = Permission::all();

        // Super Admin gets ALL permissions
        $superAdmin->permissions()->sync($allPermissions->pluck('id'));
        $this->command->info('✅ Super Admin: ' . $allPermissions->count() . ' permisos asignados');

        // Admin gets most permissions except role management
        $adminPermissions = Permission::whereNotIn('name', [
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.assign',
        ])->get();

        $admin->permissions()->sync($adminPermissions->pluck('id'));
        $this->command->info('✅ Admin: ' . $adminPermissions->count() . ' permisos asignados');

        // Regular User gets only view permissions for their own data
        $userPermissions = Permission::whereIn('name', [
            'products.view',
            'categories.view',
            'subscriptions.view',
            'banners.view',
        ])->get();

        $user->permissions()->sync($userPermissions->pluck('id'));
        $this->command->info('✅ User: ' . $userPermissions->count() . ' permisos asignados');
    }
}
