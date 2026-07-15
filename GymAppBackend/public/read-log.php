<?php
opcache_reset();
header('Content-Type: text/plain');

try {
    $host = 'aws-1-us-east-1.pooler.supabase.com';
    $port = '5432';
    $database = 'postgres';
    $user = 'postgres.edogsfwdluaubsfdknul';
    $password = 'Jeremias_02.@';

    $dsn = "pgsql:host=$host;port=$port;dbname=$database";
    $pdo = new PDO($dsn, $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "Connected successfully to database!\n";
    
    $stmt = $pdo->query("SELECT name, price FROM subscription_plans");
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Total plans found: " . count($plans) . "\n";
    foreach ($plans as $p) {
        echo "- {$p['name']} (${$p['price']})\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
