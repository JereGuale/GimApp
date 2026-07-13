<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyIncome extends Model
{
    protected $fillable = [
        'client_name',
        'amount',
        'entry_date'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'entry_date' => 'datetime'
    ];
}
