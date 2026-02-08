<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class CreateTestUsersSeeder extends Seeder
{
    public function run()
    {
        // Get roles
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $trainerRole = Role::where('name', 'trainer')->first();
        $userRole = Role::where('name', 'user')->first();

        // Create or update users
        $users = [
            [
                'name' => 'Jeremi Guale',
                'email' => 'gualejeremi@gmail.com',
                'password' => '123456',
                'role' => 'user',
                'roleModel' => $userRole,
            ],
            [
                'name' => 'Trainer Fitness',
                'email' => 'trainer@fitness.com',
                'password' => 'password123',
                'role' => 'trainer',
                'roleModel' => $trainerRole,
            ],
            [
                'name' => 'Admin Fitness',
                'email' => 'admin@fitness.com',
                'password' => 'password123',
                'role' => 'admin',
                'roleModel' => $adminRole,
            ],
        ];

        foreach ($users as $userData) {
            // Find or create user
            $user = User::updateOrCreate(
            ['email' => $userData['email']],
            [
                'name' => $userData['name'],
                'password' => Hash::make($userData['password']),
                'role' => $userData['role'],
            ]
            );

            // Detach all roles and attach the correct one
            $user->roles()->sync([]);
            if ($userData['roleModel']) {
                $user->roles()->attach($userData['roleModel']->id);
            }

            echo "✓ Usuario creado/actualizado: {$user->email} (password: {$userData['password']}) - Rol: {$userData['role']}\n";
        }

        echo "\n✅ Usuarios de prueba creados exitosamente\n";
        echo "\nCredenciales:\n";
        echo "1. gualejeremi@gmail.com / 123456 (User)\n";
        echo "2. trainer@fitness.com / password123 (Trainer)\n";
        echo "3. admin@fitness.com / password123 (Admin)\n";
    }
}
