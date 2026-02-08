<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Category;
use App\Models\Product;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getMetrics(Request $request)
    {
        try {
            $now = Carbon::now();

            // Monthly earnings
            $monthlyEarnings = Subscription::whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->sum('price');

            // Previous month earnings for comparison
            $prevMonthEarnings = Subscription::whereMonth('created_at', $now->copy()->subMonth()->month)
                ->whereYear('created_at', $now->copy()->subMonth()->year)
                ->sum('price');

            $monthlyChangePercent = $prevMonthEarnings > 0
                ? round((($monthlyEarnings - $prevMonthEarnings) / $prevMonthEarnings) * 100)
                : 0;

            // Weekly earnings
            $weekStart = $now->copy()->startOfWeek();
            $weekEnd = $now->copy()->endOfWeek();

            $weeklyEarnings = Subscription::whereBetween('created_at', [$weekStart, $weekEnd])
                ->sum('price');

            // Previous week earnings
            $prevWeekStart = $now->copy()->subWeek()->startOfWeek();
            $prevWeekEnd = $now->copy()->subWeek()->endOfWeek();

            $prevWeekEarnings = Subscription::whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])
                ->sum('price');

            $weeklyChangePercent = $prevWeekEarnings > 0
                ? round((($weeklyEarnings - $prevWeekEarnings) / $prevWeekEarnings) * 100)
                : 0;

            // Daily earnings for the week (for chart)
            $dailyEarnings = Subscription::whereBetween('created_at', [$weekStart, $weekEnd])
                ->select(
                DB::raw('EXTRACT(DOW FROM created_at) as day_of_week'),
                DB::raw('SUM(price) as amount')
            )
                ->groupBy('day_of_week')
                ->pluck('amount', 'day_of_week')
                ->toArray();

            // Format daily data for chart (0=Sunday, 1=Monday, etc.)
            $days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday to Saturday
            $chartData = [];
            for ($i = 0; $i < 7; $i++) {
                $chartData[] = [
                    'day' => $days[$i],
                    'amount' => isset($dailyEarnings[$i]) ? floatval($dailyEarnings[$i]) : 0
                ];
            }

            // User statistics
            $newRegistrationsThisWeek = User::whereBetween('created_at', [$weekStart, $weekEnd])
                ->count();

            $newRegistrationsPrevWeek = User::whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])
                ->count();

            $registrationsChange = $newRegistrationsPrevWeek > 0
                ? $newRegistrationsThisWeek - $newRegistrationsPrevWeek
                : $newRegistrationsThisWeek;

            // Total active users (all users)
            $activeUsers = User::count();

            // Users by role
            $usersByRole = User::select('role', DB::raw('COUNT(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray();

            // Mock online users (will implement real session tracking later)
            $onlineNow = rand(20, 50);

            // Category and product counts
            $categoriesCount = Category::count();
            $productsCount = Product::count();

            // Active and Expiring Subscriptions
            $activeSubscriptions = Subscription::where('status', 'active')
                ->where('ends_at', '>', $now)
                ->count();

            $expiringSubscriptions = Subscription::where('status', 'active')
                ->where('ends_at', '>', $now)
                ->where('ends_at', '<=', $now->copy()->addDays(7)) // Expiring in next 7 days
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'earnings' => [
                        'monthly' => floatval($monthlyEarnings),
                        'monthly_change_percent' => $monthlyChangePercent,
                        'weekly' => floatval($weeklyEarnings),
                        'weekly_change_percent' => $weeklyChangePercent,
                        'daily' => $chartData
                    ],
                    'subscriptions' => [
                        'active' => $activeSubscriptions,
                        'expiring' => $expiringSubscriptions
                    ],
                    'users' => [
                        'new_registrations_this_week' => $newRegistrationsThisWeek,
                        'new_registrations_change' => $registrationsChange,
                        'active_users' => $activeUsers,
                        'online_now' => $onlineNow,
                        'by_role' => $usersByRole
                    ],
                    'categories_count' => $categoriesCount,
                    'products_count' => $productsCount
                ]
            ], 200);

        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener métricas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
