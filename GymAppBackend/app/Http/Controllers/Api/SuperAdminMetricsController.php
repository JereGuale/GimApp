<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Checkin;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SuperAdminMetricsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $monthsToFetch = max(1, (int)$request->query('months', 6));

            // Reusable cache key based on requested months
            $cacheKey = "superadmin_metrics_v2_{$monthsToFetch}";

            $metrics = Cache::remember($cacheKey, 60, function () use ($monthsToFetch) {
                $now = Carbon::now();
                $start = $now->copy()->subMonths($monthsToFetch - 1)->startOfMonth();

                $weekStart = $now->copy()->startOfWeek();
                $weekEnd = $now->copy()->endOfWeek();
                $prevWeekStart = $now->copy()->subWeek()->startOfWeek();
                $prevWeekEnd = $now->copy()->subWeek()->endOfWeek();

                // ── 1. Aggregated Subscriptions Earnings and Stats (Single Query) ── 
                $subStats = Subscription::selectRaw("
                    SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ? THEN price ELSE 0 END) as monthly_earnings,
                    SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ? THEN price ELSE 0 END) as prev_month_earnings,
                    SUM(CASE WHEN created_at >= ? AND created_at <= ? THEN price ELSE 0 END) as weekly_earnings,
                    SUM(CASE WHEN created_at >= ? AND created_at <= ? THEN price ELSE 0 END) as prev_week_earnings,
                    COUNT(CASE WHEN status = 'active' AND ends_at > NOW() THEN 1 END) as active_subscriptions,
                    COUNT(CASE WHEN status = 'active' AND ends_at > NOW() AND ends_at <= NOW() + INTERVAL '7 days' THEN 1 END) as expiring_subscriptions
                ", [
                    $now->month, $now->year,
                    $now->copy()->subMonth()->month, $now->copy()->subMonth()->year,
                    $weekStart, $weekEnd,
                    $prevWeekStart, $prevWeekEnd
                ])->first();

                $monthlyEarnings = floatval($subStats->monthly_earnings ?? 0);
                $prevMonthEarnings = floatval($subStats->prev_month_earnings ?? 0);
                $monthlyChangePercent = $prevMonthEarnings > 0 ? round((($monthlyEarnings - $prevMonthEarnings) / $prevMonthEarnings) * 100) : ($monthlyEarnings > 0 ? 100 : 0);

                $weeklyEarnings = floatval($subStats->weekly_earnings ?? 0);
                $prevWeekEarnings = floatval($subStats->prev_week_earnings ?? 0);
                $weeklyChangePercent = $prevWeekEarnings > 0 ? round((($weeklyEarnings - $prevWeekEarnings) / $prevWeekEarnings) * 100) : ($weeklyEarnings > 0 ? 100 : 0);

                // ── 2. Daily Earnings for current week ──
                $dailyRaw = Subscription::whereBetween('created_at', [$weekStart, $weekEnd])
                    ->selectRaw('EXTRACT(DOW FROM created_at) as day_of_week, SUM(price) as amount')
                    ->groupBy('day_of_week')
                    ->pluck('amount', 'day_of_week')
                    ->toArray();

                $dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
                $dailyChart = [];
                for ($i = 0; $i < 7; $i++) {
                    $dailyChart[] = [
                        'label' => $dayLabels[$i],
                        'value' => isset($dailyRaw[$i]) ? floatval($dailyRaw[$i]) : 0,
                    ];
                }

                // ── 3. Revenue & Registrations by month ──
                $revenueByMonth = DB::select("SELECT TO_CHAR(starts_at, 'YYYY-MM') as month, SUM(price) as total FROM subscriptions WHERE starts_at >= ? GROUP BY month ORDER BY month", [$start]);
                $registrationsByMonth = DB::select("SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as total FROM users WHERE created_at >= ? GROUP BY month ORDER BY month", [$start]);

                // ── 4. Aggregated User Stats ──
                $userStats = User::selectRaw("
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 END) as new_registrations_week,
                    COUNT(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 END) as new_registrations_prev_week
                ", [$weekStart, $weekEnd, $prevWeekStart, $prevWeekEnd])->first();

                $totalUsers = intval($userStats->total_users ?? 0);
                $newRegistrationsThisWeek = intval($userStats->new_registrations_week ?? 0);
                $registrationsChange = $newRegistrationsThisWeek - intval($userStats->new_registrations_prev_week ?? 0);

                $usersByRole = DB::table('users')->select('role', DB::raw('COUNT(*) as count'))->groupBy('role')->pluck('count', 'role')->toArray();

                // ── 5. Peak hours & DB Counts ──
                $peakHours = DB::select("SELECT EXTRACT(HOUR FROM checked_in_at)::int as hour, COUNT(*) as total FROM checkins WHERE checked_in_at >= ? GROUP BY hour ORDER BY total DESC LIMIT 6", [$start]);
                $peakUsersTotal = collect($peakHours)->sum('total');

                $categoriesCount = DB::table('categories')->count();
                $productsCount = DB::table('products')->count();

                return [
                'revenue_by_month' => $revenueByMonth,
                'registrations_by_month' => $registrationsByMonth,
                'peak_hours' => $peakHours,
                'monthly_income' => $monthlyEarnings,
                'monthly_change_percent' => $monthlyChangePercent,
                'weekly_income' => $weeklyEarnings,
                'weekly_change_percent' => $weeklyChangePercent,
                'daily_chart' => $dailyChart,
                'total_users' => $totalUsers,
                'new_registrations_week' => $newRegistrationsThisWeek,
                'registrations_change' => $registrationsChange,
                'users_by_role' => $usersByRole,
                'active_subscriptions' => intval($subStats->active_subscriptions ?? 0),
                'expiring_subscriptions' => intval($subStats->expiring_subscriptions ?? 0),
                'peak_users_total' => $peakUsersTotal,
                'categories_count' => $categoriesCount,
                'products_count' => $productsCount,
                ];
            });

            return response()->json($metrics);
        }
        catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener métricas',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
