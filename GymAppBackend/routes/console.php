<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Notification;
use App\Models\Subscription;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('subscriptions:update-expired', function () {
    $count = \App\Models\Subscription::updateExpiredStatus();
    $this->info("Se actualizaron {$count} suscripciones expiradas a estado 'expired'.");
})->purpose('Actualiza las suscripciones vencidas a estado expired');

Artisan::command('subscriptions:notify-expiring {--days=7 : Días antes del vencimiento}', function () {
    $days = max(1, (int) $this->option('days'));
    $targetDate = now()->addDays($days)->toDateString();
    $subscriptions = Subscription::with(['user', 'plan'])
        ->where('status', 'active')
        ->whereDate('ends_at', $targetDate)
        ->get();
    $created = 0;

    foreach ($subscriptions as $subscription) {
        $alreadyNotified = Notification::where('user_id', $subscription->user_id)
            ->where('type', 'subscription_expiring')
            ->where('data->subscription_id', $subscription->id)
            ->exists();

        if (!$alreadyNotified) {
            Notification::create([
                'user_id' => $subscription->user_id,
                'type' => 'subscription_expiring',
                'title' => 'Tu membresía vence pronto',
                'message' => "Tu membresía {$subscription->plan?->name} vence en {$days} días. Renueva para mantener tu acceso al gimnasio.",
                'data' => [
                    'subscription_id' => $subscription->id,
                    'plan_name' => $subscription->plan?->name,
                    'ends_at' => $subscription->ends_at?->toDateString(),
                    'days' => $days,
                ],
            ]);
            $created++;
        }
    }

    $this->info("Se crearon {$created} notificaciones de vencimiento.");
})->purpose('Notifica al usuario cuando su membresía vence en el número de días indicado');

Schedule::command('subscriptions:notify-expiring --days=7')->dailyAt('09:00');
