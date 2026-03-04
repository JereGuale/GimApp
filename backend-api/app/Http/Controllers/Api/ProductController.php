<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\SupabaseStorage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    private function uploadImage(string $base64Image, int $index): ?string
    {
        if (!preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type))
            return null;
        $imageData = base64_decode(substr($base64Image, strpos($base64Image, ',') + 1));
        if ($imageData === false)
            return null;

        $ext = strtolower($type[1]);
        $fileName = 'product_' . time() . '_' . $index . '.' . $ext;
        $filePath = 'products/' . $fileName;
        $mime = $ext === 'png' ? 'image/png' : ($ext === 'gif' ? 'image/gif' : 'image/jpeg');

        $supabase = new SupabaseStorage();
        if ($supabase->isConfigured()) {
            $url = $supabase->uploadBinary($filePath, $imageData, $mime);
            if ($url)
                return $url;
        }

        // Fallback to local (ephemeral on Render)
        Storage::disk('public')->put($filePath, $imageData);
        $appUrl = rtrim(config('app.url', 'https://gimapp.onrender.com'), '/');
        return $appUrl . '/storage/' . $filePath;
    }

    public function index(Request $request)
    {
        $cacheKey = 'products_index_' . md5(json_encode($request->all()));
        $products = Cache::remember($cacheKey, 300, function () use ($request) {
            $query = Product::with('category');
            if ($request->has('category_id'))
                $query->where('category_id', $request->category_id);
            if ($request->has('is_featured'))
                $query->where('is_featured', $request->is_featured);
            if ($request->has('search'))
                $query->where('name', 'like', '%' . $request->search . '%');
            $productsData = $query->get();
            $productsData->each(fn($p) => $p->image_url = $p->image_url);
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
        if (!empty($validated['images'])) {
            foreach ($validated['images'] as $idx => $b64) {
                $url = $this->uploadImage($b64, $idx);
                if ($url)
                    $imageUrls[] = $url;
            }
        }

        $validated['image'] = $imageUrls[0] ?? 'https://via.placeholder.com/400';
        $validated['images'] = !empty($imageUrls) ? $imageUrls : null;
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
            'images' => 'nullable|array',
            'images.*' => 'nullable|string',
            'category_id' => 'sometimes|required|exists:categories,id',
            'stock' => 'nullable|integer|min:0',
            'is_featured' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        if ($request->hasFile('images')) {
            $supabase = new SupabaseStorage();
            $imageUrls = [];
            foreach ($request->file('images') as $image) {
                $fileName = 'product_' . time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $filePath = 'products/' . $fileName;
                $url = null;
                if ($supabase->isConfigured()) {
                    $url = $supabase->uploadFile($image, $filePath);
                }
                if (!$url) {
                    $path = $image->store('products', 'public');
                    $appUrl = rtrim(config('app.url', 'https://gimapp.onrender.com'), '/');
                    $url = $appUrl . '/storage/' . $path;
                }
                $imageUrls[] = $url;
            }
            $validated['image'] = $imageUrls[0] ?? $product->image;
            $validated['images'] = $imageUrls;
        }
        elseif ($request->has('images') && is_array($request->images)) {
            $imageUrls = [];
            foreach ($request->images as $idx => $img) {
                if (is_string($img) && str_starts_with($img, 'data:image')) {
                    $url = $this->uploadImage($img, $idx);
                    if ($url)
                        $imageUrls[] = $url;
                }
                elseif (is_string($img) && str_starts_with($img, 'http')) {
                    // Mantener URLs existentes (Supabase, etc.)
                    $imageUrls[] = $img;
                }
            }
            if (!empty($imageUrls)) {
                $validated['image'] = $imageUrls[0];
                $validated['images'] = $imageUrls;
            }
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