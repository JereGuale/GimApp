<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'payment_method',
        'payment_receipt',
        'total',
        'items',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'notes',
        'billing_name',
        'billing_email',
        'billing_phone',
        'billing_id_number',
        'billing_city',
        'billing_address',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'items' => 'array',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Aprobar pedido
     */
    public function approve($approverId)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $approverId,
            'approved_at' => now(),
        ]);
    }

    /**
     * Rechazar pedido
     */
    public function reject($reason = null)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason ?? 'Pedido rechazado',
        ]);
    }

    /**
     * Obtener URL del comprobante
     */
    public function getReceiptUrlAttribute()
    {
        if (!$this->payment_receipt) return null;

        if (strpos($this->payment_receipt, 'http') === 0) {
            return $this->payment_receipt;
        }

        return asset('storage/' . $this->payment_receipt);
    }
}
