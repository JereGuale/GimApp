<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'duration',
        'features',
        'icon',
        'color',
        'is_best_value',
        'status'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_best_value' => 'boolean'
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'subscription_plan_id');
    }
}
