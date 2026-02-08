$user = App\Models\User::where('email', 'admin@fitness.com')->first();
$role = App\Models\Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
$user->assignRole($role);
$perms = App\Models\Permission::all();
$role->syncPermissions($perms);
$trainer = App\Models\Role::firstOrCreate(['name' => 'trainer', 'guard_name' => 'web']);
echo "SUCCESS: SuperAdmin has " . $role->permissions()->count() . " permissions. Trainer role exists.";
