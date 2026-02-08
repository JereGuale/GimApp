<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PromotionalBanner;

class PromotionalBannerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default carnival banner
        PromotionalBanner::create([
            'title' => 'Oferta Mes de Carnaval!',
            'description' => '¡Aprovecha esta oferta especial!',
            'price' => 25.00,
            'image_url' => null, // Will use local fallback image
            'button_text' => 'Comprar Ahora',
            'button_action' => 'subscription',
            'is_active' => true,
            'display_order' => 1
        ]);

        echo "✅ Default promotional banner created\n";
    }
}
