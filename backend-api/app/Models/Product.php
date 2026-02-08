<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'image',
        'images',
        'category_id',
        'stock',
        'is_featured',
        'status'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_featured' => 'boolean',
        'images' => 'array'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
