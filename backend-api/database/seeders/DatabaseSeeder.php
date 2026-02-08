<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Location;
use App\Models\Offer;
use App\Models\Product;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Remove duplicate categories by name (keep the oldest)
        $duplicateNames = Category::select('name')
            ->groupBy('name')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('name');

        foreach ($duplicateNames as $name) {
            $idsToDelete = Category::where('name', $name)
                ->orderBy('id')
                ->skip(1)
                ->pluck('id');

            if ($idsToDelete->isNotEmpty()) {
                Category::whereIn('id', $idsToDelete)->delete();
            }
        }

        // Create categories
        $supplements = Category::updateOrCreate(
        ['name' => 'Suplementos'],
        ['icon' => 'pills', 'color' => '#22D3EE', 'status' => 'active']
        );

        $apparel = Category::updateOrCreate(
        ['name' => 'Ropa Deportiva'],
        ['icon' => 'shirt', 'color' => '#FB923C', 'status' => 'active']
        );

        $others = Category::updateOrCreate(
        ['name' => 'Otros'],
        ['icon' => 'barbell', 'color' => '#A78BFA', 'status' => 'active']
        );

        // Create products
        Product::create([
            'name' => 'Creatina Monohidratada',
            'description' => 'Suplemento de creatina pura para mejorar el rendimiento',
            'price' => 30.00,
            'image' => 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop',
            'category_id' => $supplements->id,
            'stock' => 50,
            'is_featured' => true
        ]);

        Product::create([
            'name' => 'Proteina Whey',
            'description' => 'Proteína de suero de leche de alta calidad',
            'price' => 25.00,
            'image' => 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=800&auto=format&fit=crop',
            'category_id' => $supplements->id,
            'stock' => 75,
            'is_featured' => true
        ]);

        Product::create([
            'name' => 'Camiseta Deportiva',
            'description' => 'Camiseta transpirable para entrenamientos intensos',
            'price' => 20.00,
            'image' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
            'category_id' => $apparel->id,
            'stock' => 100,
            'is_featured' => true
        ]);

        Product::create([
            'name' => 'Botella Térmica',
            'description' => 'Botella térmica de acero inoxidable 750ml',
            'price' => 15.00,
            'image' => 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop',
            'category_id' => $others->id,
            'stock' => 60,
            'is_featured' => true
        ]);

        // Create subscription plans
        SubscriptionPlan::create([
            'name' => 'Plan Básico',
            'description' => 'Acceso básico al gimnasio',
            'price' => 20.00,
            'duration' => 'monthly',
            'features' => json_encode(['Acceso al gimnasio', 'Horario limitado']),
            'icon' => 'barbell-outline',
            'color' => '#22D3EE',
            'is_best_value' => false
        ]);

        SubscriptionPlan::create([
            'name' => 'Plan Pro',
            'description' => 'El plan más popular con todo incluido',
            'price' => 35.00,
            'duration' => 'monthly',
            'features' => json_encode([
                'Acceso ilimitado',
                'Clases grupales',
                'Entrenador personal (2 sesiones)',
                'Descuento en productos',
                'Oferta Carnaval incluida'
            ]),
            'icon' => 'fitness',
            'color' => '#FB923C',
            'is_best_value' => true
        ]);

        SubscriptionPlan::create([
            'name' => 'Plan Elite',
            'description' => 'Experiencia premium completa',
            'price' => 50.00,
            'duration' => 'monthly',
            'features' => json_encode([
                'Todo del Plan Pro',
                'Entrenador personal ilimitado',
                'Nutricionista',
                'Zona VIP'
            ]),
            'icon' => 'trophy',
            'color' => '#A78BFA',
            'is_best_value' => false
        ]);

        Location::updateOrCreate(
        ['name' => 'Sede Central'],
        [
            'address' => 'Av. Principal 123',
            'city' => 'Ciudad'
        ]
        );

        Offer::updateOrCreate(
        ['title' => 'Oferta Mes de Carnaval'],
        [
            'subtitle' => 'Solo $25.00',
            'price' => 25.00,
            'image_url' => 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop',
            'is_image_only' => false,
            'status' => 'active'
        ]
        );

        // Create test users
        User::updateOrCreate(
        ['email' => 'trainer@fitness.com'],
        [
            'name' => 'Admin User',
            'password' => bcrypt('password123'),
            'role' => 'trainer'
        ]
        );

        User::updateOrCreate(
        ['email' => 'jere@gmail.com'],
        [
            'name' => 'Jere Guale',
            'password' => bcrypt('123456'),
            'role' => 'user'
        ]
        );

        User::updateOrCreate(
        ['email' => 'admin@fitness.com'],
        [
            'name' => 'Super Admin',
            'password' => bcrypt('password123'),
            'role' => 'admin'
        ]
        );

        User::updateOrCreate(
        ['email' => 'user@fitness.com'],
        [
            'name' => 'Basic User',
            'password' => bcrypt('password123'),
            'role' => 'user'
        ]
        );

        // Run Permission Seeder (Assigns roles to users)
        $this->call(PermissionSeeder::class);
    }
}
