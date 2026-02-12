<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class AssignRolesToExistingUsers extends Seeder
{
    public function run()
    {
        // Get all roles
        $roles = Role::all()->keyBy('name');

        // Get all users
        $users = User::all();

        echo "Encontrados " . $users->count() . " usuarios\n";

        foreach ($users as $user) {
            // Clear existing roles
            $user->roles()->detach();

            // Assign role based on old 'role' column
            $oldRole = $user->role;

            if ($oldRole === 'super_admin' && isset($roles['super_admin'])) {
                $user->roles()->attach($roles['super_admin']->id);
                echo "✓ Asignado Super Admin a: {$user->email}\n";
            }
            elseif ($oldRole === 'trainer' && isset($roles['trainer'])) {
                $user->roles()->attach($roles['trainer']->id);
                echo "✓ Asignado Trainer a: {$user->email}\n";
            }
            else {
                // Default to user role
                if (isset($roles['user'])) {
                    $user->roles()->attach($roles['user']->id);
                    echo "✓ Asignado User a: {$user->email}\n";
                }
            }
        }

        echo "\n✅ Roles asignados a todos los usuarios existentes\n";
    }
}
