<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\Cache;

class CatalogController extends Controller
{
    public function categories()
    {
        $categories = Cache::remember('catalog_categories_with_products', 300, function () {
            return Category::with('products')->get();
        });

        return response()->json($categories);
    }

    public function categoryProducts(string $id)
    {
        $category = Category::findOrFail($id);
        $products = $category->products()->get();

        return response()->json($products);
    }

    public function subscriptionPlans()
    {
        $plans = Cache::remember('catalog_subscription_plans', 300, function () {
            return SubscriptionPlan::where('status', 'active')->get();
        });
        return response()->json($plans);
    }
}
