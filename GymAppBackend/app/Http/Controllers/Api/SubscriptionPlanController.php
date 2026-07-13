<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    public function index()
    {
        $plans = SubscriptionPlan::all();
        return response()->json($plans);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration' => 'nullable|string',
            'features' => 'nullable|array',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
            'is_best_value' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $plan = SubscriptionPlan::create($validated);
        return response()->json($plan, 201);
    }

    public function show(string $id)
    {
        $plan = SubscriptionPlan::findOrFail($id);
        return response()->json($plan);
    }

    public function update(Request $request, string $id)
    {
        $plan = SubscriptionPlan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'duration' => 'nullable|string',
            'features' => 'nullable|array',
            'icon' => 'nullable|string',
            'color' => 'nullable|string',
            'is_best_value' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $plan->update($validated);
        return response()->json($plan);
    }

    public function destroy(string $id)
    {
        $plan = SubscriptionPlan::findOrFail($id);
        $plan->delete();
        return response()->json(['message' => 'Subscription plan deleted successfully'], 200);
    }
}
