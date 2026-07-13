<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permission extends SpatiePermission
{
    use HasFactory;

    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'description',
        'category',
        'is_active',
        'scope',
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];
}
