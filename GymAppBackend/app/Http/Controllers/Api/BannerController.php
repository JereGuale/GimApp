<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromotionalBanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BannerController extends Controller
{
    /**
     * Get ALL active promotional banners (for carousel)
     */
    public function getActiveBanners()
    {
        try {
            $banners = PromotionalBanner::where('is_active', true)
                ->orderBy('display_order', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $banners
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching banners',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the active promotional banner (single - legacy)
     */
    public function getActiveBanner()
    {
        try {
            $banner = PromotionalBanner::getActive();

            if (!$banner) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active banner found',
                    'data' => null
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $banner->id,
                    'title' => $banner->title,
                    'description' => $banner->description,
                    'price' => $banner->price,
                    'image_url' => $banner->image_url,
                    'button_text' => $banner->button_text,
                    'button_action' => $banner->button_action
                ]
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching banner',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all banners (ADMIN ONLY)
     */
    public function getAllBanners()
    {
        try {
            $banners = PromotionalBanner::orderBy('display_order', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $banners
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching banners',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update banner (ADMIN ONLY)
     */
    public function updateBanner(Request $request, $id)
    {
        try {
            $banner = PromotionalBanner::findOrFail($id);

            if ($request->has('title')) $banner->title = $request->input('title') ?: '';
            if ($request->has('description')) $banner->description = $request->input('description');
            if ($request->has('price')) $banner->price = $request->filled('price') ? floatval($request->input('price')) : null;
            if ($request->has('button_text')) $banner->button_text = $request->input('button_text') ?: '';
            if ($request->has('button_action')) $banner->button_action = $request->input('button_action') ?: 'subscription';
            if ($request->has('is_active')) $banner->is_active = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
            if ($request->has('display_order')) $banner->display_order = intval($request->input('display_order', 0));

            $banner->save();

            return response()->json([
                'success' => true,
                'message' => 'Banner actualizado exitosamente',
                'data' => $banner
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar banner: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload banner image (ADMIN ONLY)
     */
    public function uploadBannerImage(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048' // 2MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $banner = PromotionalBanner::findOrFail($id);

            // Delete old image if exists
            if ($banner->image_url) {
                $oldPath = str_replace(url('storage/'), '', $banner->image_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Store new image
            $image = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('banners', $filename, 'public');

            // Update banner
            $banner->image_url = $path;
            $banner->save();

            return response()->json([
                'success' => true,
                'message' => 'Banner image uploaded successfully',
                'data' => [
                    'id' => $banner->id,
                    'image_url' => $banner->image_url
                ]
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error uploading image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete banner image (ADMIN ONLY)
     */
    public function deleteBannerImage($id)
    {
        try {
            $banner = PromotionalBanner::findOrFail($id);

            if ($banner->image_url) {
                $path = str_replace(url('storage/'), '', $banner->image_url);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }

            $banner->image_url = null;
            $banner->save();

            return response()->json([
                'success' => true,
                'message' => 'Banner image deleted successfully'
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new banner (ADMIN ONLY)
     */
    public function createBanner(Request $request)
    {
        try {
            // Validate image only
            if ($request->hasFile('image')) {
                $imgValidator = Validator::make($request->all(), [
                    'image' => 'image|mimes:jpeg,png,jpg,webp|max:5120'
                ]);
                if ($imgValidator->fails()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Imagen inválida: ' . $imgValidator->errors()->first()
                    ], 422);
                }
            }

            $banner = new PromotionalBanner();
            $banner->title = $request->input('title') ?: '';
            $banner->description = $request->input('description');
            $banner->price = $request->filled('price') ? floatval($request->input('price')) : null;
            $banner->button_text = $request->input('button_text') ?: '';
            $banner->button_action = $request->input('button_action') ?: 'subscription';
            $banner->is_active = filter_var($request->input('is_active', false), FILTER_VALIDATE_BOOLEAN);
            $banner->display_order = intval($request->input('display_order', 0));

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('banners', $filename, 'public');
                $banner->image_url = $path;
            }

            $banner->save();

            return response()->json([
                'success' => true,
                'message' => 'Banner creado exitosamente',
                'data' => $banner
            ], 201);
        }
        catch (\Exception $e) {
            \Log::error('createBanner error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear banner: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a banner (ADMIN ONLY)
     */
    public function deleteBanner($id)
    {
        try {
            $banner = PromotionalBanner::findOrFail($id);

            // Delete image if exists
            if ($banner->getRawOriginal('image_url')) {
                $path = $banner->getRawOriginal('image_url');
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }

            $banner->delete();

            return response()->json([
                'success' => true,
                'message' => 'Banner deleted successfully'
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting banner',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
