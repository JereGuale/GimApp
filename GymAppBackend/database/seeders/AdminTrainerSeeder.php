<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminTrainerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Create Admin user
        User::updateOrCreate(
        ['email' => 'admin@fitness.com'],
        [
            'name' => 'Panel Admin',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]
        );

        echo "✅ Admin created: admin@fitness.com / password123\n";

        // Display created users
        $users = User::whereIn('email', ['admin@fitness.com'])->get();
        echo "\n📋 Created users:\n";
        foreach ($users as $user) {
            echo "  - {$user->name} ({$user->email}) - Role: {$user->role}\n";
        }
    }
}
