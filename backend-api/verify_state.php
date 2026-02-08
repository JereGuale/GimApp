try {
    $u = App\Models\User::where('email', 'admin@fitness.com')->first();
    echo "User: " . ($u ? $u->email : 'NOT FOUND') . "\n";
    
    if ($u) {
        $roles = $u->roles->pluck('name')->toArray();
        echo "Roles: " . implode(', ', $roles) . "\n";
        
        $canView = $u->can('users.view');
        echo "Can users.view: " . ($canView ? 'YES' : 'NO') . "\n";
    }

    $trainerExists = App\Models\Role::where('name', 'trainer')->exists();
    echo "Trainer Role Exists: " . ($trainerExists ? 'YES' : 'NO') . "\n";

    // FORCE FIX
    $sa = App\Models\Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
    $trainer = App\Models\Role::firstOrCreate(['name' => 'trainer', 'guard_name' => 'web']);
    
    $pids = App\Models\Permission::all()->pluck('id');
    $rid = $sa->id;
    
    echo "Fixing perms for Role ID $rid (" . $pids->count() . " perms)...\n";
    
    foreach($pids as $pid) {
        try {
            DB::table('role_has_permissions')->insertOrIgnore([
                'permission_id' => $pid,
                'role_id' => $rid
            ]);
        } catch (\Exception $e) {}
    }
    
    echo "DONE. SuperAdmin has " . $sa->permissions()->count() . " permissions.\n";
    
    // Assign role to admin user
    $u = App\Models\User::where('email', 'admin@fitness.com')->first();
    if ($u) {
        try {
             DB::table('model_has_roles')->insertOrIgnore([
                'role_id' => $rid,
                'model_type' => 'App\Models\User',
                'model_id' => $u->id
             ]);
             echo "User assigned to role directly.\n";
        } catch(\Exception $e) {}
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
