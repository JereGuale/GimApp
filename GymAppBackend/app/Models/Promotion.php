<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $fillable = [
        'name',
        'description',
        'discount_percent',
        'starts_at',
        'ends_at',
        'status',
        'product_id',
        'category_id'
    ];

    protected $casts = [
        'discount_percent' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
