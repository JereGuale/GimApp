<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        return Product::with('category')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
            'status' => 'nullable|string'
        ]);

        $imageUrls = [];
        $baseUrl = rtrim(config('app.url'), '/');
        if (isset($validated['images']) && is_array($validated['images'])) {
            foreach ($validated['images'] as $index => $base64Image) {
                if (!is_string($base64Image)) {
                    continue;
                }
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
                    $base64Image = substr($base64Image, strpos($base64Image, ',') + 1);
                    $type = strtolower($type[1]);

                    $imageData = base64_decode($base64Image);
                    if ($imageData === false) {
                        continue;
                    }

                    $fileName = 'product_' . time() . '_' . $index . '.' . $type;
                    $filePath = 'products/' . $fileName;
                    Storage::disk('public')->put($filePath, $imageData);
                    $imageUrls[] = $baseUrl . Storage::url($filePath);
                }
            }
        }

        $validated['image'] = $imageUrls[0] ?? ($validated['image'] ?? null);
        $validated['images'] = !empty($imageUrls) ? $imageUrls : null;
        $validated['status'] = $validated['status'] ?? 'active';

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return $product->load('category');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'string',
            'price' => 'numeric|min:0',
            'description' => 'nullable|string',
            'category_id' => 'exists:categories,id',
            'image' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'nullable|string',
            'is_featured' => 'boolean',
            'status' => 'string'
        ]);

        $imageUrls = [];
        $baseUrl = rtrim(config('app.url'), '/');
        if (isset($validated['images']) && is_array($validated['images'])) {
            foreach ($validated['images'] as $index => $base64Image) {
                if (!is_string($base64Image)) {
                    continue;
                }
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
                    $base64Image = substr($base64Image, strpos($base64Image, ',') + 1);
                    $type = strtolower($type[1]);

                    $imageData = base64_decode($base64Image);
                    if ($imageData === false) {
                        continue;
                    }

                    $fileName = 'product_' . time() . '_' . $index . '.' . $type;
                    $filePath = 'products/' . $fileName;
                    Storage::disk('public')->put($filePath, $imageData);
                    $imageUrls[] = $baseUrl . Storage::url($filePath);
                }
            }
        }

        if (!empty($imageUrls)) {
            $validated['image'] = $imageUrls[0];
            $validated['images'] = $imageUrls;
        }

        $product->update($validated);

        return $product;
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->noContent();
    }
}
