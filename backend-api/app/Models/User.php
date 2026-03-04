<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, \Spatie\Permission\Traits\HasRoles;

    protected $appends = ['profile_photo_url'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profile_photo',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
    // Accessor para la URL pública de la foto de perfil
    public function getProfilePhotoUrlAttribute()
    {
        if (!$this->profile_photo)
            return null;
        // Si ya es URL absoluta (Supabase o Render), devolverla tal cual
        if (str_starts_with($this->profile_photo, 'http')) {
            return $this->profile_photo;
        }
        // Ruta relativa: usar asset()
        return asset('storage/' . $this->profile_photo);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('super_admin');
    }

    public function isTrainer(): bool
    {
        return $this->hasRole('trainer');
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

// Custom RBAC methods removed in favor of Spatie HasRoles
}
