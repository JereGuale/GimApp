<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FixGuardsSeeder extends Seeder
{
    public function run()
    {
        // Force update all to sanctum
        DB::table('roles')->update(['guard_name' => 'sanctum']);
        DB::table('permissions')->update(['guard_name' => 'sanctum']);

        $superAdmin = Role::where('name', 'super_admin')->first();
        if (!$superAdmin) {
            $superAdmin = Role::create(['name' => 'super_admin', 'guard_name' => 'sanctum']);
        }

        $user = User::where('email', 'admin@fitness.com')->first();
        if ($user) {
            // Raw DB insert to bypass Spatie cache issues
            DB::table('model_has_roles')->where('model_id', $user->id)->delete();
            DB::table('model_has_roles')->insert([
                'role_id' => $superAdmin->id,
                'model_type' => 'App\\Models\\User',
                'model_id' => $user->id
            ]);
            $this->command->info('Configured admin user with super_admin (sanctum)');
        }

        // Clear cache
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
