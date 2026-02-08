<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar caché de permisos
        // app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Truncate tables to ensure clean state
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        DB::table('role_has_permissions')->delete();
        DB::table('model_has_roles')->delete();
        DB::table('model_has_permissions')->delete();
        DB::table('roles')->delete();
        DB::table('permissions')->delete();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        // Lista de Permisos Solicitados
        $permissions = [
            // Dashboard
            ['name' => 'dashboard.view', 'display_name' => 'Ver Dashboard', 'category' => 'Dashboard', 'scope' => 'trainer', 'description' => 'Ver estadísticas principales'],

            // Usuarios
            ['name' => 'users.view', 'display_name' => 'Ver Usuarios', 'category' => 'Usuarios', 'scope' => 'trainer', 'description' => 'Ver lista de usuarios'],
            ['name' => 'users.edit', 'display_name' => 'Editar Usuarios', 'category' => 'Usuarios', 'scope' => 'trainer', 'description' => 'Editar información de usuarios'],

            // Clientes
            ['name' => 'clients.view', 'display_name' => 'Ver Clientes', 'category' => 'Clientes', 'scope' => 'trainer', 'description' => 'Ver lista de clientes asignados'],
            ['name' => 'clients.edit', 'display_name' => 'Editar Clientes', 'category' => 'Clientes', 'scope' => 'trainer', 'description' => 'Gestionar clientes'],

            // Rutinas
            ['name' => 'routines.view', 'display_name' => 'Ver Rutinas', 'category' => 'Rutinas', 'scope' => 'trainer', 'description' => 'Ver rutinas creadas'],
            ['name' => 'routines.create', 'display_name' => 'Crear Rutinas', 'category' => 'Rutinas', 'scope' => 'trainer', 'description' => 'Crear nuevas rutinas'],
            ['name' => 'routines.edit', 'display_name' => 'Editar Rutinas', 'category' => 'Rutinas', 'scope' => 'trainer', 'description' => 'Modificar rutinas existentes'],

            // Suscripciones
            ['name' => 'subscriptions.view', 'display_name' => 'Ver Suscripciones', 'category' => 'Suscripciones', 'scope' => 'trainer', 'description' => 'Ver estado de suscripciones'],
            ['name' => 'subscriptions.manage', 'display_name' => 'Gestionar Suscripciones', 'category' => 'Suscripciones', 'scope' => 'trainer', 'description' => 'Aprobar o rechazar suscripciones'],

            // Banners
            ['name' => 'banners.view', 'display_name' => 'Ver Banners', 'category' => 'Banners', 'scope' => 'trainer', 'description' => 'Ver banners activos'],
            ['name' => 'banners.edit', 'display_name' => 'Gestionar Banners', 'category' => 'Banners', 'scope' => 'trainer', 'description' => 'Subir o eliminar banners'],

            // Configuración
            ['name' => 'settings.view', 'display_name' => 'Ver Configuración', 'category' => 'Configuración', 'scope' => 'trainer', 'description' => 'Ver configuraciones del sistema'],

            // Roles y Permisos (Admin Super solo, pero definimos por si acaso)
            ['name' => 'roles.view', 'display_name' => 'Ver Roles', 'category' => 'Roles', 'scope' => 'super_admin', 'description' => 'Ver lista de roles'],
            ['name' => 'roles.manage', 'display_name' => 'Gestionar Roles', 'category' => 'Roles', 'scope' => 'super_admin', 'description' => 'Crear, editar y eliminar roles'],
        ];

        foreach ($permissions as $perm) {
            Permission::updateOrCreate(
            ['name' => $perm['name']],
            [
                'display_name' => $perm['display_name'],
                'category' => $perm['category'],
                'scope' => $perm['scope'],
                'description' => $perm['description'],
                'guard_name' => 'sanctum',
                'is_active' => true,
            ]
            );
        }

        // Crear Roles Base
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'sanctum']);
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']); // Legacy support
        $trainerRole = Role::firstOrCreate(['name' => 'trainer', 'guard_name' => 'sanctum']);
        $userRole = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'sanctum']);

        // Asignar TODO a Super Admin
        $allPermissions = Permission::all();
        $superAdminRole->syncPermissions($allPermissions);
        $adminRole->syncPermissions($allPermissions); // Legacy admin gets all too

        // Asignar permisos específicos a Trainer
        $trainerPermissionNames = [
            'dashboard.view',
            'users.view', 'users.edit',
            'clients.view', 'clients.edit',
            'routines.view', 'routines.create', 'routines.edit',
            'subscriptions.view', 'subscriptions.manage',
            'banners.view', 'banners.edit',
            'settings.view'
        ];

        $trainerPerms = Permission::whereIn('name', $trainerPermissionNames)->get();
        $trainerRole->syncPermissions($trainerPerms);

        // Crear Usuario Super Admin por defecto si no existe
        $adminEmail = 'admin@fitness.com';
        $adminUser = User::firstOrCreate(
        ['email' => $adminEmail],
        [
            'name' => 'Super Admin',
            'password' => Hash::make('password123'),
            'role' => 'admin', // Legacy column support
        ]
        );

        // Asegurar que tenga el rol Spatie
        if (!$adminUser->hasRole('super_admin')) {
            $adminUser->assignRole($superAdminRole);
        }
        if (!$adminUser->hasRole('admin')) {
            $adminUser->assignRole($adminRole);
        }

    }
}
