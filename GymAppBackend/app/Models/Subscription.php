<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_plan_id',
        'status',
        'payment_method',
        'payment_receipt',
        'card_data',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'starts_at',
        'ends_at',
        'price'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'approved_at' => 'datetime',
        'card_data' => 'encrypted'
    ];

    protected $hidden = [
        'card_data'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class , 'subscription_plan_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class , 'approved_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Helper methods
    public function getDurationMonths()
    {
        $duration = $this->plan ? $this->plan->duration : 'monthly';
        if ($duration === 'quarterly') {
            return 3;
        }
        if ($duration === 'semiannual') {
            return 6;
        }
        if ($duration === 'annual' || $duration === 'yearly') {
            return 12;
        }
        if (is_numeric($duration)) {
            return (int)$duration;
        }
        return 1; // default to 1 month for 'monthly' or fallback
    }

    public function approve($approverId)
    {
        $this->update([
            'status' => 'active',
            'approved_by' => $approverId,
            'approved_at' => now(),
            'starts_at' => now(),
            'ends_at' => now()->addDays($this->getDurationMonths() * 30)
        ]);
    }

    public function reject($reason = null)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason ?? 'Comprobante no válido'
        ]);
    }
}
