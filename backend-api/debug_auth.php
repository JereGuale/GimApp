<?php
// Check user
$u = \App\Models\User::where('email', 'admin@fitness.com')->first();
echo "User: " . $u->email . " (ID: $u->id)\n";

// Check Model Has Roles
$mhrs = \Illuminate\Support\Facades\DB::table('model_has_roles')->where('model_id', $u->id)->get();
echo "Roles assigned (DB): " . count($mhrs) . "\n";
foreach ($mhrs as $mhr) {
    echo " - Role ID: " . $mhr->role_id . " Model Type: " . $mhr->model_type . "\n";
}

// Check Roles Table
$roles = \App\Models\Role::all();
echo "All Roles:\n";
foreach ($roles as $r) {
    echo "ID: " . $r->id . " Name: " . $r->name . " Guard: " . $r->guard_name . "\n";
}

// Check Permissions Table
$perms = \App\Models\Permission::take(5)->get();
echo "Sample Perms:\n";
foreach ($perms as $p) {
    echo "ID: " . $p->id . " Name: " . $p->name . " Guard: " . $p->guard_name . "\n";
}

// Check if User has Role via Code
echo "User has role super_admin (web)? " . ($u->hasRole('super_admin') ? 'YES' : 'NO') . "\n";

// Create token to test
$token = $u->createToken('test-token')->plainTextToken;
echo "Test Token: " . substr($token, 0, 10) . "...\n";
