<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'price',
        'image_url',
        'is_image_only',
        'starts_at',
        'ends_at',
        'status'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_image_only' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime'
    ];
}
