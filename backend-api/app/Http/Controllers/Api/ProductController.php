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
        // Robust regex for Data URIs
        if (!preg_match('/^data:image\/(\w+);base64,(.*)$/s', $base64Image, $matches)) {
            Log::warning("UploadImage: Invalid base64 format at index $index");
            return null;
        }

        $extension = strtolower($matches[1]);
        $imageData = base64_decode($matches[2]);

        if ($imageData === false) {
            Log::error("UploadImage: Failed to decode base64 data at index $index");
            return null;
        }

        $ext = $extension;
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
            'images.*' => 'nullable' // Allows both string and UploadedFile
        ]);

        Log::info('Product store request received', [
            'has_files' => $request->hasFile('images'),
            'file_keys' => array_keys($request->allFiles()),
            'all_keys' => $request->keys(),
            'images_raw' => $request->input('images')
        ]);

        $imageUrls = [];

        if ($request->hasFile('images')) {
            $files = $request->file('images');
            Log::info('Processing uploaded files', ['count' => count($files)]);
            $supabase = new SupabaseStorage();
            if (!$supabase->isConfigured()) {
                Log::warning('Supabase is NOT configured. Fallback used.');
            }
            foreach ($files as $idx => $image) {
                $ext = $image->getClientOriginalExtension() ?: 'jpg';
                $fileName = 'product_' . time() . '_' . $idx . '_' . uniqid() . '.' . $ext;
                $filePath = 'products/' . $fileName;
                $url = null;
                if ($supabase->isConfigured()) {
                    $url = $supabase->uploadFile($image, $filePath);
                }
                if (!$url) {
                    $path = $image->storeAs('products', $fileName, 'public');
                    $appUrl = rtrim(config('app.url', 'https://gimapp.onrender.com'), '/');
                    $url = $appUrl . '/storage/' . $path;
                }
                $imageUrls[] = $url;
            }
        }

        // Si no hay archivos, buscar en el input 'images' (base64 o URLs)
        if (empty($imageUrls) && !empty($validated['images'])) {
            Log::info('No files found, checking input images array', ['count' => count($validated['images'])]);
            foreach ($validated['images'] as $idx => $img) {
                if (is_string($img) && str_starts_with($img, 'data:image')) {
                    $url = $this->uploadImage($img, $idx);
                    if ($url)
                        $imageUrls[] = $url;
                }
                elseif (is_string($img) && str_starts_with($img, 'http')) {
                    $imageUrls[] = $img;
                }
            }
        }

        if (empty($imageUrls) && ($request->hasFile('images') || ($request->has('images') && is_array($request->images) && count($request->images) > 0))) {
            Log::error('Product creation failed: No valid images processed', [
                'has_images_key' => $request->has('images'),
                'images_count' => is_array($request->images) ? count($request->images) : 'not an array',
                'files_count' => $request->hasFile('images') ? count($request->file('images')) : 0
            ]);
            return response()->json([
                'message' => 'Error: No se pudieron procesar las imágenes. Asegúrate de seleccionar al menos una foto válida (formato base64, URL o archivo subido).',
                'debug' => [
                    'has_files' => $request->hasFile('images'),
                    'files_received' => count($request->allFiles()),
                    'supabase_configured' => (new SupabaseStorage())->isConfigured(),
                    'input_images_count' => is_array($request->input('images')) ? count($request->input('images')) : 'not array'
                ]
            ], 422);
        }

        if (empty($imageUrls)) {
            Log::warning('Product creation attempt without images, using placeholder');
        }

        $validated['image'] = $imageUrls[0] ?? 'https://via.placeholder.com/400x400?text=No+Image';
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
            'images.*' => 'nullable', // Allows both string and UploadedFile
            'category_id' => 'sometimes|required|exists:categories,id',
            'stock' => 'nullable|integer|min:0',
            'is_featured' => 'nullable|boolean',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        Log::info('Product update request received', [
            'id' => $id,
            'has_files' => $request->hasFile('images'),
            'file_keys' => array_keys($request->allFiles()),
            'images_raw' => $request->input('images')
        ]);

        if ($request->hasFile('images')) {
            $files = $request->file('images');
            Log::info('Processing updated files', ['count' => count($files)]);
            $supabase = new SupabaseStorage();
            if (!$supabase->isConfigured()) {
                Log::warning('Supabase is NOT configured for update. Fallback used.');
            }
            $imageUrls = [];
            foreach ($files as $idx => $image) {
                $ext = $image->getClientOriginalExtension() ?: 'jpg';
                $fileName = 'product_' . time() . '_' . $idx . '_' . uniqid() . '.' . $ext;
                $filePath = 'products/' . $fileName;
                $url = null;
                if ($supabase->isConfigured()) {
                    $url = $supabase->uploadFile($image, $filePath);
                }
                if (!$url) {
                    $path = $image->storeAs('products', $fileName, 'public');
                    $appUrl = rtrim(config('app.url', 'https://gimapp.onrender.com'), '/');
                    $url = $appUrl . '/storage/' . $path;
                }
                $imageUrls[] = $url;
            }
            $validated['image'] = $imageUrls[0] ?? $product->image;
            $validated['images'] = $imageUrls;
        }
        elseif ($request->has('images') && is_array($request->images)) {
            Log::info('Updating with existing images array', ['count' => count($request->images)]);
            $imageUrls = [];
            foreach ($request->images as $idx => $img) {
                if (is_string($img) && str_starts_with($img, 'data:image')) {
                    $url = $this->uploadImage($img, $idx);
                    if ($url)
                        $imageUrls[] = $url;
                }
                elseif (is_string($img) && str_starts_with($img, 'http')) {
                    $imageUrls[] = $img;
                }
            }
            if (!empty($imageUrls)) {
                $validated['image'] = $imageUrls[0];
                $validated['images'] = $imageUrls;
            }
            else if (count($request->images) > 0) {
                Log::error('Product update failed: Images array sent but no valid URLs/Base64 found.');
                return response()->json([
                    'message' => 'Error: No se pudieron procesar las imágenes enviadas.',
                    'debug' => ['received_count' => count($request->images)]
                ], 422);
            }
        }

        $product->update($validated);
        $product->image_url = $product->image_url;
        return response()->json($product->load('category'));
    }

    public function destroy(string $id)
    {
        Log::info('Attempting to delete product', ['id' => $id]);
        $product = Product::find($id);
        if (!$product) {
            Log::error('Product not found for deletion', ['id' => $id]);
            return response()->json(['message' => 'Product not found (ID: ' . $id . ')'], 404);
        }
        $product->delete();
        Log::info('Product deleted successfully', ['id' => $id]);
        return response()->json(['message' => 'Product deleted successfully'], 200);
    }
}