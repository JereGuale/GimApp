<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

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

    protected static function booted()
    {
        static::saved(function ($product) {
            Cache::flush();
        });

        static::deleted(function ($product) {
            Cache::flush();
        });
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Accessor para la URL pública de la imagen principal
    public function getImageUrlAttribute()
    {
        if (!$this->image)
            return null;

        // Si es una URL de localhost (imagen vieja del entorno local), no existe en producción
        if (preg_match('/http:\/\/(localhost|127\.0\.0\.1|192\.168\.)/', $this->image)) {
            return 'https://via.placeholder.com/400x400?text=Sin+imagen';
        }

        // Si es una URL absoluta externa (Supabase, placeholder, etc.)
        if (strpos($this->image, 'http') === 0) {
            // Si tiene /storage/ de nuestra propia app, reconstruir con APP_URL actual
            if (strpos($this->image, '/storage/') !== false &&
            !str_contains($this->image, 'supabase.co') &&
            !str_contains($this->image, 'placeholder.com')) {
                $path = explode('/storage/', $this->image)[1];
                return asset('storage/' . $path);
            }
            return $this->image;
        }

        // Ruta relativa
        return asset('storage/' . $this->image);
    }
}
