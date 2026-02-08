<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SubscriptionPlan;

class CatalogController extends Controller
{
    public function categories()
    {
        $categories = Category::where('status', 'active')
            ->with(['products' => function ($query) {
                $query->where('status', 'active');
            }])
            ->get();

        return response()->json($categories);
    }

    public function categoryProducts(string $id)
    {
        $category = Category::where('status', 'active')->findOrFail($id);
        $products = $category->products()->where('status', 'active')->get();

        return response()->json($products);
    }

    public function subscriptionPlans()
    {
        $plans = SubscriptionPlan::where('status', 'active')->get();
        return response()->json($plans);
    }
}
