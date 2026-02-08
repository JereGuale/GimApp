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
        $trainer = Role::where('name', 'trainer')->first();
        $user = Role::where('name', 'user')->first();

        if (!$superAdmin || !$trainer || !$user) {
            $this->command->error('❌ Roles no encontrados. Ejecuta RoleSeeder primero.');
            return;
        }

        // Get all permissions
        $allPermissions = Permission::all();

        // Super Admin gets ALL permissions
        $superAdmin->permissions()->sync($allPermissions->pluck('id'));
        $this->command->info('✅ Super Admin: ' . $allPermissions->count() . ' permisos asignados');

        // Trainer gets most permissions except role management
        $trainerPermissions = Permission::whereNotIn('name', [
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.assign',
        ])->get();

        $trainer->permissions()->sync($trainerPermissions->pluck('id'));
        $this->command->info('✅ Trainer: ' . $trainerPermissions->count() . ' permisos asignados');

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
