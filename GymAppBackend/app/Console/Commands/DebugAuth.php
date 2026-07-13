<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class DebugAuth extends Command
{
    protected $signature = 'debug:auth';
    protected $description = 'Debug authentication state for admin user';

    public function handle()
    {
        $this->info('Starting Auth Debug...');

        $user = User::where('email', 'admin@fitness.com')->first();
        if (!$user) {
            $this->error('User admin@fitness.com not found!');
            return;
        }

        $this->info("User found: {$user->id} - {$user->name}");
        $this->info("User guard (from config): " . config('auth.defaults.guard'));

        $this->info('--- Assigned Roles (DB) ---');
        $roles = DB::table('model_has_roles')->where('model_id', $user->id)->get();
        foreach ($roles as $r) {
            $roleDef = Role::find($r->role_id);
            $this->info("Role ID: {$r->role_id} -> Name: " . ($roleDef ? $roleDef->name : 'UNKNOWN') . " | Guard: " . ($roleDef ? $roleDef->guard_name : 'N/A'));
        }

        $this->info('--- Has Role Check ---');
        try {
            $isSuperAdmin = $user->hasRole('super_admin');
            $this->info("hasRole('super_admin'): " . ($isSuperAdmin ? 'YES' : 'NO'));
        }
        catch (\Exception $e) {
            $this->error("Error checking role: " . $e->getMessage());
        }

        $this->info('--- Permissions of super_admin role ---');
        $saRole = Role::where('name', 'super_admin')->where('guard_name', 'sanctum')->first();
        if ($saRole) {
            $perms = $saRole->permissions()->count();
            $this->info("Super Admin (sanctum) has {$perms} permissions.");
        }
        else {
            $this->error('Role super_admin (sanctum) NOT FOUND');
        }

        $this->info('--- Token Generation ---');
        try {
            $token = $user->createToken('debug-token')->plainTextToken;
            $this->info("Generated Token: " . substr($token, 0, 20) . "...");
        }
        catch (\Exception $e) {
            $this->error("Token generation failed: " . $e->getMessage());
        }
    }
}
