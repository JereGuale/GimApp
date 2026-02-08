<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run()
    {
        // Crear roles base
        $superAdmin = Role::updateOrCreate(
        ['name' => 'super_admin'],
        [
            'display_name' => 'Super Admin',
            'description' => 'Control total del sistema',
            'is_active' => true
        ]
        );

        $admin = Role::updateOrCreate(
        ['name' => 'admin'],
        [
            'display_name' => 'Admin',
            'description' => 'Administrador del gimnasio',
            'is_active' => true
        ]
        );

        $trainer = Role::updateOrCreate(
        ['name' => 'trainer'],
        [
            'display_name' => 'Entrenador',
            'description' => 'Entrenador del gimnasio',
            'is_active' => true
        ]
        );

        $user = Role::updateOrCreate(
        ['name' => 'user'],
        [
            'display_name' => 'Usuario',
            'description' => 'Usuario regular del gimnasio',
            'is_active' => true
        ]
        );

        // Super Admin tiene TODOS los permisos
        $allPermissions = Permission::all();
        $superAdmin->permissions()->sync($allPermissions->pluck('id'));

        // Admin tiene casi todos los permisos excepto gestión de roles
        $adminPermissions = Permission::whereNotIn('name', ['manage_roles', 'manage_permissions', 'assign_roles'])
            ->get();
        $admin->permissions()->sync($adminPermissions->pluck('id'));

        // Trainer tiene permisos limitados
        $trainerPermissions = Permission::whereIn('name', [
            'view_users',
            'view_products',
            'view_categories',
            'view_subscriptions',
            'view_checkins'
        ])->get();
        $trainer->permissions()->sync($trainerPermissions->pluck('id'));

        // User tiene permisos muy básicos
        $userPermissions = Permission::whereIn('name', [
            'view_products',
            'view_categories'
        ])->get();
        $user->permissions()->sync($userPermissions->pluck('id'));

        $this->command->info('Roles y permisos asignados exitosamente.');
    }
}
