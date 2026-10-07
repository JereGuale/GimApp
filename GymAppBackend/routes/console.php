<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('subscriptions:update-expired', function () {
    $count = \App\Models\Subscription::updateExpiredStatus();
    $this->info("Se actualizaron {$count} suscripciones expiradas a estado 'expired'.");
})->purpose('Actualiza las suscripciones vencidas a estado expired');
