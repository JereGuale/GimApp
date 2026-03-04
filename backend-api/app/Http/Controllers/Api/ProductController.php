<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    private function uploadImageToSupabase(string $base64Image, int $index): ?string
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
            return null;
        }
        $imageData = base64_decode(substr($base64Image, strpos($base64Image, ',') + 1));
        if ($imageData === false) return null;

        $ext = strtolower($type[1]);
        $fileName = 'product_' . time() . '_' . $index . '.' . $ext;
        $filePath = 'products/' . $fileName;

        try {
            Storage::disk('supabase')->put($filePath, $imageData, 'public');
            return Storage::disk('supabase')->url($filePath);
        } catch (\Exception $e) {
            Log::error('Supabase upload failed: ' . $e->getMessage());
            // Fallback to local
            Storage::disk('public')->put($filePath, $imageData);
            return Storage::disk('public')->url($filePath);
        }
    }

    public function index(Request $request)
    {
        $cacheKey = 'products_index_' . md5(json_encode($request->all()));

        $products = Cache::remember($cacheKey, 300, function () use ($request) {
            $query = Product::with('category');

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }
            if ($request->has('is_featured')) {
                $query->where('is_featured', $request->is_featured);
            }
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            $productsData = $query->get();
            $productsData->each(function($product) {
                $product->image_url = $product->image_url;
            });
            return $productsData;
        });

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'stock' => 'nullable|integer|min:0',
            'is_featured' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive',
            'images' => 'nullable|array',
            'images.*' => 'nullable|string'
        ]);

        $imageUrls = [];
        if (isset($validated['images']) && is_array($validated['images'])) {
            foreach ($validated['images'] as $index => $base64Image) {
                $url = $this->uploadImageToSupabase($base64Image, $index);
                if ($url) $imageUrls[] = $url;
            }
        }

        $validated['image'] = $imageUrls[0] ?? 'https://via.placeholder.com/400';
        $validated['images'] = !empty($imageUrls) ? json_encode($imageUrls) : null;
        $validated['status'] = $validated['status'] ?? 'active';

        $product = Product::create($validated);
        $product->image_url = $product->image_url;
        return response()->json($product->load('category'), 201);
    }

    public function show(string $id)
    {
        $product = Product::with('category')->findOrFail($id);
        $product->image_url = $product->image_url;
        return response()->json($product);
    }

    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'image' => 'nullable|string',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'category_id' => 'sometimes|required|exists:categories,id',
            'stock' => 'nullable|integer|min:0',
            'is_featured' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        if ($request->hasFile('images')) {
            $imageUrls = [];
            foreach ($request->file('images') as $image) {
                try {
                    $fileName = 'product_' . time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                    Storage::disk('supabase')->putFileAs('products', $image, $fileName, 'public');
                    $imageUrls[] = Storage::disk('supabase')->url('products/' . $fileName);
                } catch (\Exception $e) {
                    $path = $image->store('products', 'public');
                    $imageUrls[] = Storage::disk('public')->url($path);
                }
            }
            $validated['image'] = $imageUrls[0] ?? $product->image;
            $validated['images'] = $imageUrls;
        }

        $product->update($validated);
        $product->image_url = $product->image_url;
        return response()->json($product->load('category'));
    }

    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully'], 200);
    }
}