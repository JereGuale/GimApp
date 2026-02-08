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
    public function getImageUrlAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // If it's already a full URL, return as is
        if (str_starts_with($value, 'http')) {
            return $value;
        }

        // Otherwise, prepend the app URL
        return url('storage/' . $value);
    }
}
