

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::with('category');

        // Filtrar por categoría si se proporciona
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filtrar por productos destacados
        if ($request->has('is_featured')) {
            $query->where('is_featured', $request->is_featured);
        }

        // Buscar por nombre
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $products = $query->get();
        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */

    public function store(Request $request)
    {
        \Log::info('Product store request', [
            'all' => $request->all(),
            'files' => $request->allFiles(),
            'hasImages' => $request->hasFile('images')
        ]);

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

        // Procesar imágenes en base64
        $imageUrls = [];
        if (isset($validated['images']) && is_array($validated['images'])) {
            foreach ($validated['images'] as $index => $base64Image) {
                if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
                    $base64Image = substr($base64Image, strpos($base64Image, ',') + 1);
                    $type = strtolower($type[1]); // jpg, png, gif

                    $imageData = base64_decode($base64Image);
                    if ($imageData === false) {
                        continue;
                    }

                    $fileName = 'product_' . time() . '_' . $index . '.' . $type;
                    $filePath = 'products/' . $fileName;
                    
                    Storage::disk('public')->put($filePath, $imageData);
                    $imageUrls[] = Storage::url($filePath);
                }
            }
        }

        $validated['image'] = $imageUrls[0] ?? 'https://via.placeholder.com/400';
        $validated['images'] = !empty($imageUrls) ? json_encode($imageUrls) : null;
        $validated['status'] = $validated['status'] ?? 'active';
        
        $product = Product::create($validated);
        
        \Log::info('Product created', [
            'id' => $product->id,
            'image' => $product->image,
            'images' => $product->images
        ]);
        
        return response()->json($product->load('category'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = Product::with('category')->findOrFail($id);
        return response()->json($product);
    }


    /**
     * Update the specified resource in storage.
     */
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
                $path = $image->store('products', 'public');
                $imageUrls[] = Storage::url($path);
            }
            $validated['image'] = $imageUrls[0] ?? $product->image;
            $validated['images'] = $imageUrls;
        }
        $product->update($validated);
        return response()->json($product->load('category'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully'], 200);
    }
}
