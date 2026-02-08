<?php
// Correct syntax for Tinker piping
$roles = \App\Models\Role::all();
foreach ($roles as $role) {
    if ($role->guard_name !== 'sanctum') {
        $role->guard_name = 'sanctum';
        $role->save();
        echo "Updated role {$role->name} to sanctum\n";
    }
}

$perms = \App\Models\Permission::all();
foreach ($perms as $perm) {
    if ($perm->guard_name !== 'sanctum') {
        $perm->guard_name = 'sanctum';
        $perm->save();
    }
}
echo "Updated permissions to sanctum\n";

// Re-assign role
$user = \App\Models\User::where('email', 'admin@fitness.com')->first();
if ($user) {
    $role = \App\Models\Role::where('name', 'super_admin')->where('guard_name', 'sanctum')->first();
    // detach old web roles
    $user->roles()->detach();
    // assign new sanctum role
    if ($role) {
        $user->assignRole($role);
        echo "Assigned super_admin (sanctum) to admin\n";
    }
}
