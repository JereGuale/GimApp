<?php
// generate_super_admin_token.php
// Script para generar un nuevo token Bearer para el usuario super_admin

use Illuminate\Database\Capsule\Manager as DB;
use Illuminate\Support\Str;

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

// Buscar usuario con rol super_admin
$user = DB::table('users')->where('role', 'super_admin')->first();
if (!$user) {
    echo "No se encontró un usuario con rol super_admin.\n";
    exit(1);
}

// Generar token usando el modelo User y Sanctum
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$app->make('Illuminate\Contracts\Http\Kernel');

$laravelUser = App\Models\User::find($user->id);
$token = $laravelUser->createToken('super_admin_panel', ['*']);

echo "Nuevo token Bearer generado para super_admin:\n";
echo $token->plainTextToken . "\n";
