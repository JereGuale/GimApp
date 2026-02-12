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
use App\Http\Controllers\Api\TrainerSubscriptionController;
use App\Http\Controllers\Api\NotificationController;

Route::post('/login', [AuthController::class, 'login']);

Route::post('/register', [AuthController::class, 'register']);

// Endpoint público temporal para diagnóstico
Route::get('/ping', function () {
    return response()->json(['pong' => true, 'ts' => now()]);
});

Route::middleware('auth:sanctum')->group(function () {
        // Gestión de roles y usuarios (AdminPanelRoles)
        Route::get('/admin/users', [\App\Http\Controllers\AdminPanelRolesController::class, 'listUsers']);
        Route::get('/admin/roles', [\App\Http\Controllers\AdminPanelRolesController::class, 'listRoles']);
        Route::post('/admin/users/{user}/role', [\App\Http\Controllers\AdminPanelRolesController::class, 'changeUserRole']);
        Route::get('/admin/roles/permissions', [\App\Http\Controllers\AdminPanelRolesController::class, 'rolesPermissionsMatrix']);
    Route::get('/home', [HomeController::class, 'index']);
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/categories/{id}/products', [CatalogController::class, 'categoryProducts']);
    Route::get('/subscription/plans', [CatalogController::class, 'subscriptionPlans']);
    Route::get('/subscription/my', [SubscriptionController::class, 'my']);
    Route::post('/subscription/subscribe', [SubscriptionController::class, 'store']);
    Route::post('/subscription/{id}/upload-receipt', [SubscriptionController::class, 'uploadReceipt']);
    Route::post('/checkins', [CheckinController::class, 'store']);
    Route::get('/offers/active', [OfferController::class, 'active']);

    // Profile photo upload
    Route::post('/profile/photo', [AuthController::class, 'uploadPhoto']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Banner routes
    Route::get('/banners/active', [BannerController::class, 'getActiveBanners']);
    Route::get('/admin/banners', [BannerController::class, 'getAllBanners']);
    Route::post('/admin/banners', [BannerController::class, 'createBanner']);
    Route::put('/admin/banners/{id}', [BannerController::class, 'updateBanner']);
    Route::post('/admin/banners/{id}/image', [BannerController::class, 'uploadBannerImage']);
    Route::delete('/admin/banners/{id}/image', [BannerController::class, 'deleteBannerImage']);
    Route::delete('/admin/banners/{id}', [BannerController::class, 'deleteBanner']);

    // Trainer/Admin subscription management routes
    Route::get('/trainer/subscriptions', [TrainerSubscriptionController::class, 'index']);
    Route::get('/trainer/subscriptions/pending-count', [TrainerSubscriptionController::class, 'pendingCount']);
    Route::post('/trainer/subscriptions/{id}/approve', [TrainerSubscriptionController::class, 'approve']);
    Route::post('/trainer/subscriptions/{id}/reject', [TrainerSubscriptionController::class, 'reject']);
    Route::post('/trainer/subscriptions/create', [TrainerSubscriptionController::class, 'create']);

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
