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
     * Get the active promotional banner (PUBLIC)
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
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'nullable|numeric|min:0',
                'button_text' => 'nullable|string|max:100',
                'button_action' => 'nullable|string|max:100',
                'is_active' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $banner = PromotionalBanner::findOrFail($id);
            $banner->update($request->only([
                'title',
                'description',
                'price',
                'button_text',
                'button_action',
                'is_active'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Banner updated successfully',
                'data' => $banner
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating banner',
                'error' => $e->getMessage()
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
}
