<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckinController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\SuperAdminMetricsController;
use App\Http\Controllers\Api\SuperAdminUserController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/home', [HomeController::class, 'index']);
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/categories/{id}/products', [CatalogController::class, 'categoryProducts']);
    Route::get('/subscription/plans', [CatalogController::class, 'subscriptionPlans']);
    Route::get('/subscription/my', [SubscriptionController::class, 'my']);
    Route::post('/checkins', [CheckinController::class, 'store']);
    Route::get('/offers/active', [OfferController::class, 'active']);

    // Banner routes
    Route::get('/banners/active', [BannerController::class, 'getActiveBanners']);
    Route::get('/admin/banners', [BannerController::class, 'getAllBanners']);
    Route::post('/admin/banners', [BannerController::class, 'createBanner']);
    Route::put('/admin/banners/{id}', [BannerController::class, 'updateBanner']);
    Route::post('/admin/banners/{id}/image', [BannerController::class, 'uploadBannerImage']);
    Route::delete('/admin/banners/{id}/image', [BannerController::class, 'deleteBannerImage']);
    Route::delete('/admin/banners/{id}', [BannerController::class, 'deleteBanner']);

    // Admin routes - In development mode, all authenticated users can access these
    Route::apiResource('admin/categories', CategoryController::class);
    Route::apiResource('admin/products', ProductController::class);
    Route::apiResource('admin/subscription-plans', SubscriptionPlanController::class);
    Route::apiResource('admin/promotions', PromotionController::class);

    Route::middleware('super_admin')->group(function () {
        Route::get('/admin/metrics', [SuperAdminMetricsController::class, 'index']);
        Route::get('/admin/users', [SuperAdminUserController::class, 'index']);
        Route::put('/admin/users/{id}', [SuperAdminUserController::class, 'update']);
        Route::post('/admin/users/{id}/cancel-subscription', [SuperAdminUserController::class, 'cancelSubscription']);
        Route::apiResource('admin/locations', LocationController::class);
        Route::apiResource('admin/offers', OfferController::class);
        Route::get('/admin/settings', [SettingController::class, 'index']);
        Route::post('/admin/settings', [SettingController::class, 'upsert']);
    });
});
