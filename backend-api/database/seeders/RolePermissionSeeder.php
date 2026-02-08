<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Create default roles
        $adminRole = Role::create([
            'name' => 'admin',
            'display_name' => 'Administrador',
            'description' => 'Acceso completo al sistema',
            'is_active' => true
        ]);

        $trainerRole = Role::create([
            'name' => 'trainer',
            'display_name' => 'Entrenador',
            'description' => 'Gestión de clientes y suscripciones',
            'is_active' => true
        ]);

        $userRole = Role::create([
            'name' => 'user',
            'display_name' => 'Usuario',
            'description' => 'Usuario estándar del gimnasio',
            'is_active' => true
        ]);

        // Create permissions
        $permissions = [
            // User management
            ['name' => 'view_users', 'display_name' => 'Ver Usuarios', 'category' => 'users'],
            ['name' => 'create_users', 'display_name' => 'Crear Usuarios', 'category' => 'users'],
            ['name' => 'edit_users', 'display_name' => 'Editar Usuarios', 'category' => 'users'],
            ['name' => 'delete_users', 'display_name' => 'Eliminar Usuarios', 'category' => 'users'],

            // Product management
            ['name' => 'view_products', 'display_name' => 'Ver Productos', 'category' => 'products'],
            ['name' => 'create_products', 'display_name' => 'Crear Productos', 'category' => 'products'],
            ['name' => 'edit_products', 'display_name' => 'Editar Productos', 'category' => 'products'],
            ['name' => 'delete_products', 'display_name' => 'Eliminar Productos', 'category' => 'products'],

            // Category management
            ['name' => 'view_categories', 'display_name' => 'Ver Categorías', 'category' => 'categories'],
            ['name' => 'create_categories', 'display_name' => 'Crear Categorías', 'category' => 'categories'],
            ['name' => 'edit_categories', 'display_name' => 'Editar Categorías', 'category' => 'categories'],
            ['name' => 'delete_categories', 'display_name' => 'Eliminar Categorías', 'category' => 'categories'],

            // Subscription management
            ['name' => 'view_subscriptions', 'display_name' => 'Ver Suscripciones', 'category' => 'subscriptions'],
            ['name' => 'approve_subscriptions', 'display_name' => 'Aprobar Suscripciones', 'category' => 'subscriptions'],
            ['name' => 'reject_subscriptions', 'display_name' => 'Rechazar Suscripciones', 'category' => 'subscriptions'],
            ['name' => 'manage_subscription_plans', 'display_name' => 'Gestionar Planes', 'category' => 'subscriptions'],

            // Banner management
            ['name' => 'view_banners', 'display_name' => 'Ver Banners', 'category' => 'banners'],
            ['name' => 'edit_banners', 'display_name' => 'Editar Banners', 'category' => 'banners'],

            // Role and permission management
            ['name' => 'view_roles', 'display_name' => 'Ver Roles', 'category' => 'roles'],
            ['name' => 'create_roles', 'display_name' => 'Crear Roles', 'category' => 'roles'],
            ['name' => 'edit_roles', 'display_name' => 'Editar Roles', 'category' => 'roles'],
            ['name' => 'delete_roles', 'display_name' => 'Eliminar Roles', 'category' => 'roles'],
            ['name' => 'assign_permissions', 'display_name' => 'Asignar Permisos', 'category' => 'roles'],

            // Dashboard
            ['name' => 'view_dashboard', 'display_name' => 'Ver Dashboard', 'category' => 'dashboard'],
            ['name' => 'view_metrics', 'display_name' => 'Ver Métricas', 'category' => 'dashboard'],
        ];

        $createdPermissions = [];
        foreach ($permissions as $perm) {
            $createdPermissions[] = Permission::create([
                'name' => $perm['name'],
                'display_name' => $perm['display_name'],
                'category' => $perm['category'],
                'is_active' => true
            ]);
        }

        // Assign all permissions to admin role
        foreach ($createdPermissions as $permission) {
            $adminRole->givePermission($permission);
        }

        // Assign specific permissions to trainer role
        $trainerPermissions = [
            'view_users',
            'view_products',
            'view_categories',
            'view_subscriptions',
            'approve_subscriptions',
            'reject_subscriptions',
            'view_dashboard'
        ];

        foreach ($trainerPermissions as $permName) {
            $permission = Permission::where('name', $permName)->first();
            if ($permission) {
                $trainerRole->givePermission($permission);
            }
        }

        // User role has minimal permissions
        $userPermissions = ['view_products', 'view_categories'];
        foreach ($userPermissions as $permName) {
            $permission = Permission::where('name', $permName)->first();
            if ($permission) {
                $userRole->givePermission($permission);
            }
        }

        $this->command->info('Roles and permissions seeded successfully!');
    }
}
