<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Helper methods
    public function markAsRead()
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Create a notification for all trainers when a new subscription request comes in
     */
    public static function notifyTrainers($subscription)
    {
        $trainers = User::role('trainer')->get();

        foreach ($trainers as $trainer) {
            self::create([
                'user_id' => $trainer->id,
                'type' => 'subscription_request',
                'title' => 'Nueva solicitud de suscripción',
                'message' => "{$subscription->user->name} ha enviado una solicitud de suscripción ({$subscription->plan->name})",
                'data' => [
                    'subscription_id' => $subscription->id,
                    'user_id' => $subscription->user_id,
                    'user_name' => $subscription->user->name,
                    'user_photo' => $subscription->user->profile_photo,
                    'plan_name' => $subscription->plan->name,
                    'payment_method' => $subscription->payment_method,
                    'price' => $subscription->price,
                ],
            ]);
        }
    }

    /**
     * Notify user about subscription status change
     */
    public static function notifyUser($subscription, $status)
    {
        $title = $status === 'active'
            ? 'Suscripción aprobada'
            : 'Suscripción rechazada';

        $message = $status === 'active'
            ? "Tu suscripción al {$subscription->plan->name} ha sido aprobada. ¡Bienvenido!"
            : "Tu solicitud de suscripción al {$subscription->plan->name} fue rechazada. Motivo: {$subscription->rejection_reason}";

        self::create([
            'user_id' => $subscription->user_id,
            'type' => $status === 'active' ? 'subscription_approved' : 'subscription_rejected',
            'title' => $title,
            'message' => $message,
            'data' => [
                'subscription_id' => $subscription->id,
                'plan_name' => $subscription->plan->name,
                'status' => $status,
            ],
        ]);
    }
}
