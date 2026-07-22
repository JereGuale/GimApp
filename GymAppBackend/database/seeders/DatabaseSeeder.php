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

        // Clean old plans and create subscription plans matching Client App
        SubscriptionPlan::whereNotIn('name', ['Plan Estudiantil', 'Plan Básico', 'Plan Elite'])->delete();

        SubscriptionPlan::updateOrCreate(
            ['name' => 'Plan Estudiantil'],
            [
                'description' => 'Económico y flexible, ideal para estudiantes.',
                'price' => 20.00,
                'duration' => 'monthly',
                'features' => json_encode([
                    'Acceso total al gimnasio',
                    'Horarios flexibles',
                    'Área de cardio y peso libre',
                    'Sin contrato de permanencia'
                ]),
                'icon' => 'school-outline',
                'color' => '#00C2FF',
                'is_best_value' => false
            ]
        );

        SubscriptionPlan::updateOrCreate(
            ['name' => 'Plan Básico'],
            [
                'description' => 'El plan más equilibrado para tu entrenamiento diario.',
                'price' => 25.00,
                'duration' => 'monthly',
                'features' => json_encode([
                    'Acceso total ilimitado 24/7',
                    'Uso completo de vestidores',
                    'Clases grupales semanales',
                    '1 sesión de evaluación corporal'
                ]),
                'icon' => 'barbell-outline',
                'color' => '#F97316',
                'is_best_value' => true
            ]
        );

        SubscriptionPlan::updateOrCreate(
            ['name' => 'Plan Elite'],
            [
                'description' => 'La experiencia definitiva con acompañamiento profesional.',
                'price' => 50.00,
                'duration' => 'monthly',
                'features' => json_encode([
                    'Entrenamiento 100% personalizado',
                    'Plan nutricional a medida',
                    'Acceso ilimitado 24/7 a sedes',
                    'Acceso a zona VIP y sauna',
                    'Masajes de recuperación mensual'
                ]),
                'icon' => 'trophy',
                'color' => '#5B3DF5',
                'is_best_value' => false
            ]
        );

        Location::updateOrCreate(
        ['name' => 'Sede Manta Central'],
        [
            'address' => 'Av. Barbasquillo y Calle U1',
            'city' => 'Manta'
        ]
        );

        Location::updateOrCreate(
        ['name' => 'Sede Manta Tarqui'],
        [
            'address' => 'Av. 109 y Calle 102',
            'city' => 'Manta'
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
        ['email' => 'admin@fitness.com'],
        [
            'name' => 'Admin User',
            'password' => bcrypt('password123'),
            'role' => 'admin'
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
