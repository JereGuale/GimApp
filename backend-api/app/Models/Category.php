<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'name',
        'icon',
        'color',
        'status'
    ];

    protected $appends = ['icon_url'];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    // Accessor para la URL del icono
    public function getIconUrlAttribute()
    {
        if (!$this->icon)
            return null;

        if (strpos($this->icon, 'http') === 0) {
            if (strpos($this->icon, '/storage/') !== false) {
                $path = explode('/storage/', $this->icon)[1];
                return asset('storage/' . $path);
            }
            return $this->icon;
        }

        return asset('storage/' . $this->icon);
    }
}
