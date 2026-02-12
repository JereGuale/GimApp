<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromotionalBanner extends Model
{
    protected $fillable = [
        'title',
        'description',
        'price',
        'image_url',
        'button_text',
        'button_action',
        'is_active',
        'display_order'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    /**
     * Get the active banner
     */
    public static function getActive()
    {
        return self::where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->first();
    }

    /**
     * Get full image URL
     */
    // Accessor para la URL de la imagen
    public function getImageUrlAttribute($value)
    {
        // El atributo real en base de datos es 'image_url' (segun fillable), 
        // pero Laravel pasará el valor de la columna a este método si se llama igual.
        // Ojo: si la columna se llama image_url, el accesor debería llamarse getImageUrlAttribute
        // y recibir el valor.

        if (!$value)
            return null;

        // Si es una URL absoluta (empieza con http)
        if (strpos($value, 'http') === 0) {
            // Si es una URL de nuestra propia app (localhost o IP anterior), reemplazarla con la actual
            if (strpos($value, '/storage/') !== false) {
                // Extraer solo la parte relativa
                $parts = explode('/storage/', $value);
                if (count($parts) > 1) {
                    return asset('storage/' . $parts[1]);
                }
            }
            return $value;
        }

        return asset('storage/' . $value);
    }
}
