<?php
// generate_super_admin_token_spatie.php
// Script para generar un nuevo token Bearer para el primer usuario con rol super_admin usando Spatie

use Illuminate\Database\Capsule\Manager as DB;

require __DIR__.'/vendor/autoload.php';

// Configuración rápida para Eloquent fuera de Laravel
$db = new DB();
$db->addConnection([
    'driver'    => 'pgsql',
    'host'      => '127.0.0.1',
    'database'  => 'gimnasio',
    'username'  => 'postgres',
    'password'  => '1234',
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);
$db->setAsGlobal();
$db->bootEloquent();

// Buscar el ID del rol super_admin en la tabla roles
$role = DB::table('roles')->where('name', 'super_admin')->first();
if (!$role) {
    echo "No se encontró el rol super_admin en la tabla roles.\n";
    exit(1);
}

// Buscar el primer usuario con ese rol en model_has_roles
$modelRole = DB::table('model_has_roles')
    ->where('role_id', $role->id)
    ->where('model_type', 'App\\Models\\User')
    ->first();
if (!$modelRole) {
    echo "No se encontró ningún usuario con el rol super_admin.\n";
    exit(1);
}

$userId = $modelRole->model_id;

// Generar token usando el modelo User y Sanctum
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$app->make('Illuminate\Contracts\Http\Kernel');

$laravelUser = App\Models\User::find($userId);
$token = $laravelUser->createToken('super_admin_panel', ['*']);

echo "Nuevo token Bearer generado para super_admin (user_id: $userId):\n";
echo $token->plainTextToken . "\n";
