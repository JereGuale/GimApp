<?php
// debug_token.php
// Script para verificar el estado de un token Bearer en la base de datos Laravel Sanctum

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

$token = '29|ed0P1vpqxAZLq9fPv1H4mYFfWhpzJg7G3j45YMIua9a4df40';

$record = DB::table('personal_access_tokens')->where('id', 29)->first();

if (!$record) {
    echo "Token no encontrado en la base de datos.\n";
    exit(1);
}

print_r($record);

$user = DB::table('users')->where('id', $record->tokenable_id)->first();
if (!$user) {
    echo "Usuario asociado al token no existe.\n";
    exit(1);
}

if (isset($record->expires_at) && $record->expires_at !== null && strtotime($record->expires_at) < time()) {
    echo "El token está expirado.\n";
    exit(1);
}

echo "Token y usuario válidos.\n";
