<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = Promotion::with(['product', 'category'])->get();
        return response()->json($promotions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'discount_percent' => 'required|numeric|min:0|max:100',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after_or_equal:starts_at',
            'status' => 'nullable|string|in:active,inactive,expired',
            'product_id' => 'nullable|exists:products,id',
            'category_id' => 'nullable|exists:categories,id'
        ]);

        if (empty($validated['product_id']) && empty($validated['category_id'])) {
            return response()->json([
                'message' => 'product_id or category_id is required.'
            ], 422);
        }

        $promotion = Promotion::create($validated);
        return response()->json($promotion->load(['product', 'category']), 201);
    }

    public function show(string $id)
    {
        $promotion = Promotion::with(['product', 'category'])->findOrFail($id);
        return response()->json($promotion);
    }

    public function update(Request $request, string $id)
    {
        $promotion = Promotion::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'discount_percent' => 'sometimes|required|numeric|min:0|max:100',
            'starts_at' => 'sometimes|required|date',
            'ends_at' => 'sometimes|required|date|after_or_equal:starts_at',
            'status' => 'nullable|string|in:active,inactive,expired',
            'product_id' => 'nullable|exists:products,id',
            'category_id' => 'nullable|exists:categories,id'
        ]);

        if (array_key_exists('product_id', $validated) || array_key_exists('category_id', $validated)) {
            $productId = $validated['product_id'] ?? $promotion->product_id;
            $categoryId = $validated['category_id'] ?? $promotion->category_id;

            if (empty($productId) && empty($categoryId)) {
                return response()->json([
                    'message' => 'product_id or category_id is required.'
                ], 422);
            }
        }

        $promotion->update($validated);
        return response()->json($promotion->load(['product', 'category']));
    }

    public function destroy(string $id)
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->delete();
        return response()->json(['message' => 'Promotion deleted successfully'], 200);
    }
}
