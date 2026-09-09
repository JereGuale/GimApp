<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Checkin;
use App\Models\DailyIncome;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\Order;
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

            // Short cache of 15 seconds to keep dashboard fresh and responsive
            $cacheKey = "superadmin_metrics_v5_{$monthsToFetch}";

            $metrics = Cache::remember($cacheKey, 15, function () use ($monthsToFetch) {
                $tz = config('app.timezone', 'America/Guayaquil');
                $now = Carbon::now($tz);
                $todayStr = $now->toDateString();
                $start = $now->copy()->subMonths($monthsToFetch - 1)->startOfMonth();

                $weekStart = $now->copy()->startOfWeek();
                $weekEnd = $now->copy()->endOfWeek();
                $prevWeekStart = $now->copy()->subWeek()->startOfWeek();
                $prevWeekEnd = $now->copy()->subWeek()->endOfWeek();

                // ── 1. Aggregated Subscriptions Earnings and Stats ── 
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

                // ── 2. Aggregated Daily Incomes (Asistencias Diarias) ──
                $dailyStats = DailyIncome::selectRaw("
                    SUM(CASE WHEN DATE(entry_date) = ? THEN amount ELSE 0 END) as today_income,
                    COUNT(CASE WHEN DATE(entry_date) = ? THEN 1 END) as today_count,
                    SUM(CASE WHEN EXTRACT(MONTH FROM entry_date) = ? AND EXTRACT(YEAR FROM entry_date) = ? THEN amount ELSE 0 END) as month_income,
                    SUM(CASE WHEN EXTRACT(MONTH FROM entry_date) = ? AND EXTRACT(YEAR FROM entry_date) = ? THEN amount ELSE 0 END) as prev_month_income,
                    SUM(CASE WHEN entry_date >= ? AND entry_date <= ? THEN amount ELSE 0 END) as week_income,
                    SUM(CASE WHEN entry_date >= ? AND entry_date <= ? THEN amount ELSE 0 END) as prev_week_income
                ", [
                    $todayStr,
                    $todayStr,
                    $now->month, $now->year,
                    $now->copy()->subMonth()->month, $now->copy()->subMonth()->year,
                    $weekStart, $weekEnd,
                    $prevWeekStart, $prevWeekEnd
                ])->first();

                $subMonthlyEarnings = floatval($subStats->monthly_earnings ?? 0);
                $subPrevMonthEarnings = floatval($subStats->prev_month_earnings ?? 0);
                $dailyMonthEarnings = floatval($dailyStats->month_income ?? 0);
                $dailyPrevMonthEarnings = floatval($dailyStats->prev_month_income ?? 0);

                $dailyIncomeToday = floatval($dailyStats->today_income ?? 0);
                $dailyCountToday = intval($dailyStats->today_count ?? 0);

                // Total Income = Subscriptions + Daily Attendances
                $totalMonthlyEarnings = $subMonthlyEarnings + $dailyMonthEarnings;
                $totalPrevMonthEarnings = $subPrevMonthEarnings + $dailyPrevMonthEarnings;
                $monthlyChangePercent = $totalPrevMonthIncome = $totalPrevMonthEarnings > 0 
                    ? round((($totalMonthlyEarnings - $totalPrevMonthEarnings) / $totalPrevMonthEarnings) * 100) 
                    : ($totalMonthlyEarnings > 0 ? 100 : 0);

                $subWeeklyEarnings = floatval($subStats->weekly_earnings ?? 0);
                $subPrevWeekEarnings = floatval($subStats->prev_week_earnings ?? 0);
                $dailyWeeklyEarnings = floatval($dailyStats->week_income ?? 0);
                $dailyPrevWeeklyEarnings = floatval($dailyStats->prev_week_income ?? 0);

                $totalWeeklyEarnings = $subWeeklyEarnings + $dailyWeeklyEarnings;
                $totalPrevWeeklyEarnings = $subPrevWeekEarnings + $dailyPrevWeeklyEarnings;
                $weeklyChangePercent = $totalPrevWeeklyEarnings > 0 
                    ? round((($totalWeeklyEarnings - $totalPrevWeeklyEarnings) / $totalPrevWeeklyEarnings) * 100) 
                    : ($totalWeeklyEarnings > 0 ? 100 : 0);

                // ── 3. Daily Earnings for current week (Subscriptions + Daily Incomes) ──
                $dailySubRaw = Subscription::whereBetween('created_at', [$weekStart, $weekEnd])
                    ->selectRaw('EXTRACT(DOW FROM created_at) as day_of_week, SUM(price) as amount')
                    ->groupBy('day_of_week')
                    ->pluck('amount', 'day_of_week')
                    ->toArray();

                $dailyIncomeRaw = DailyIncome::whereBetween('entry_date', [$weekStart, $weekEnd])
                    ->selectRaw('EXTRACT(DOW FROM entry_date) as day_of_week, SUM(amount) as amount')
                    ->groupBy('day_of_week')
                    ->pluck('amount', 'day_of_week')
                    ->toArray();

                $dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
                $dailyChart = [];
                for ($i = 0; $i < 7; $i++) {
                    $val = (isset($dailySubRaw[$i]) ? floatval($dailySubRaw[$i]) : 0) +
                           (isset($dailyIncomeRaw[$i]) ? floatval($dailyIncomeRaw[$i]) : 0);
                    $dailyChart[] = [
                        'label' => $dayLabels[$i],
                        'value' => $val,
                    ];
                }

                // ── 4. Revenue & Registrations by month (Consolidated) ──
                $subsByMonth = DB::select("SELECT TO_CHAR(starts_at, 'YYYY-MM') as month, SUM(price) as total FROM subscriptions WHERE starts_at >= ? GROUP BY month ORDER BY month", [$start]);
                $dailiesByMonth = DB::select("SELECT TO_CHAR(entry_date, 'YYYY-MM') as month, SUM(amount) as total FROM daily_incomes WHERE entry_date >= ? GROUP BY month ORDER BY month", [$start]);

                $mergedRevenue = [];
                foreach ($subsByMonth as $item) {
                    $mergedRevenue[$item->month] = floatval($item->total);
                }
                foreach ($dailiesByMonth as $item) {
                    $mergedRevenue[$item->month] = ($mergedRevenue[$item->month] ?? 0) + floatval($item->total);
                }
                ksort($mergedRevenue);
                $revenueByMonth = [];
                foreach ($mergedRevenue as $m => $tot) {
                    $revenueByMonth[] = (object)['month' => $m, 'total' => $tot];
                }

                $registrationsByMonth = DB::select("SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as total FROM users WHERE created_at >= ? GROUP BY month ORDER BY month", [$start]);

                // ── 5. Aggregated User Stats ──
                $userStats = User::selectRaw("
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 END) as new_registrations_week,
                    COUNT(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 END) as new_registrations_prev_week
                ", [$weekStart, $weekEnd, $prevWeekStart, $prevWeekEnd])->first();

                $totalUsers = intval($userStats->total_users ?? 0);
                $newRegistrationsThisWeek = intval($userStats->new_registrations_week ?? 0);
                $registrationsChange = $newRegistrationsThisWeek - intval($userStats->new_registrations_prev_week ?? 0);

                $usersByRole = DB::table('users')->select('role', DB::raw('COUNT(*) as count'))->groupBy('role')->pluck('count', 'role')->toArray();

                // ── 6. Peak hours & DB Counts ──
                $peakHours = DB::select("SELECT EXTRACT(HOUR FROM checked_in_at)::int as hour, COUNT(*) as total FROM checkins WHERE checked_in_at >= ? GROUP BY hour ORDER BY total DESC LIMIT 6", [$start]);
                $peakUsersTotal = collect($peakHours)->sum('total');

                $categoriesCount = DB::table('categories')->count();
                $productsCount = DB::table('products')->count();

                // ── 7. Operational pending counts & recent subscriptions for fast dashboard load ──
                $pendingSubsCount = Subscription::where('status', 'pending')->count();
                $pendingOrdersCount = Order::where('status', 'pending')->count();
                $recentSubscriptions = Subscription::with(['user', 'plan'])
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get();

                return [
                    'revenue_by_month' => $revenueByMonth,
                    'registrations_by_month' => $registrationsByMonth,
                    'peak_hours' => $peakHours,
                    'monthly_income' => $totalMonthlyEarnings,
                    'subscriptions_income' => $subMonthlyEarnings,
                    'daily_attendances_income' => $dailyMonthEarnings,
                    'daily_income_today' => $dailyIncomeToday,
                    'daily_attendance_count_today' => $dailyCountToday,
                    'monthly_change_percent' => $monthlyChangePercent,
                    'weekly_income' => $totalWeeklyEarnings,
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
                    'pending_subscriptions_count' => $pendingSubsCount,
                    'pending_orders_count' => $pendingOrdersCount,
                    'recent_subscriptions' => $recentSubscriptions,
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
