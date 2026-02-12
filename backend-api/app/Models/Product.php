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

    // Accessor para la URL pública de la imagen principal
    public function getImageUrlAttribute()
    {
        if (!$this->image)
            return null;

        // Si es una URL absoluta (empieza con http)
        if (strpos($this->image, 'http') === 0) {
            // Si es una URL de nuestra propia app (localhost o IP anterior), reemplazarla con la actual
            if (strpos($this->image, '/storage/') !== false) {
                // Extraer solo la parte relativa (ej: products/imagen.jpg)
                $path = explode('/storage/', $this->image)[1];
                return asset('storage/' . $path);
            }
            // Si es externa real (ej: via.placeholder), devolver tal qual
            return $this->image;
        }

        // Si es ruta relativa, usar asset helper que usa APP_URL actual
        return asset('storage/' . $this->image);
    }
}
