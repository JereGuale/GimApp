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

class SuperAdminMetricsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $now = Carbon::now();
            $months = max(1, (int) $request->query('months', 6));
            $start = $now->copy()->subMonths($months - 1)->startOfMonth();

            // ── Monthly earnings (current month) ──
            $monthlyEarnings = Subscription::whereRaw("EXTRACT(MONTH FROM created_at) = ?", [$now->month])
                ->whereRaw("EXTRACT(YEAR FROM created_at) = ?", [$now->year])
                ->sum('price');

            $prevMonth = $now->copy()->subMonth();
            $prevMonthEarnings = Subscription::whereRaw("EXTRACT(MONTH FROM created_at) = ?", [$prevMonth->month])
                ->whereRaw("EXTRACT(YEAR FROM created_at) = ?", [$prevMonth->year])
                ->sum('price');

            $monthlyChangePercent = $prevMonthEarnings > 0
                ? round((($monthlyEarnings - $prevMonthEarnings) / $prevMonthEarnings) * 100)
                : ($monthlyEarnings > 0 ? 100 : 0);

            // ── Weekly earnings ──
            $weekStart = $now->copy()->startOfWeek();
            $weekEnd = $now->copy()->endOfWeek();
            $weeklyEarnings = Subscription::whereBetween('created_at', [$weekStart, $weekEnd])->sum('price');

            $prevWeekStart = $now->copy()->subWeek()->startOfWeek();
            $prevWeekEnd = $now->copy()->subWeek()->endOfWeek();
            $prevWeekEarnings = Subscription::whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])->sum('price');

            $weeklyChangePercent = $prevWeekEarnings > 0
                ? round((($weeklyEarnings - $prevWeekEarnings) / $prevWeekEarnings) * 100)
                : ($weeklyEarnings > 0 ? 100 : 0);

            // ── Daily earnings chart (current week) ──
            $dailyRaw = Subscription::whereBetween('created_at', [$weekStart, $weekEnd])
                ->select(
                    DB::raw('EXTRACT(DOW FROM created_at) as day_of_week'),
                    DB::raw('SUM(price) as amount')
                )
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

            // ── Revenue by month (historic) ──
            $revenueByMonth = Subscription::query()
                ->selectRaw("TO_CHAR(starts_at, 'YYYY-MM') as month, SUM(price) as total")
                ->where('starts_at', '>=', $start)
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // ── Registrations ──
            $newRegistrationsThisWeek = User::whereBetween('created_at', [$weekStart, $weekEnd])->count();
            $newRegistrationsPrevWeek = User::whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])->count();
            $registrationsChange = $newRegistrationsThisWeek - $newRegistrationsPrevWeek;

            $registrationsByMonth = User::query()
                ->selectRaw("TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as total")
                ->where('created_at', '>=', $start)
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // ── Users ──
            $totalUsers = User::count();
            $usersByRole = User::select('role', DB::raw('COUNT(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray();

            // ── Peak hours ──
            $peakHours = Checkin::query()
                ->selectRaw('EXTRACT(HOUR FROM checked_in_at)::int as hour, COUNT(*) as total')
                ->where('checked_in_at', '>=', $start)
                ->groupBy('hour')
                ->orderByDesc('total')
                ->limit(6)
                ->get();

            $peakUsersTotal = $peakHours->sum('total');

            // ── Subscriptions ──
            $activeSubscriptions = Subscription::where('status', 'active')
                ->where('ends_at', '>', $now)
                ->count();

            $expiringSubscriptions = Subscription::where('status', 'active')
                ->where('ends_at', '>', $now)
                ->where('ends_at', '<=', $now->copy()->addDays(7))
                ->count();

            // ── Counts ──
            $categoriesCount = Category::count();
            $productsCount = Product::count();

            return response()->json([
                // Legacy fields (keep for compatibility)
                'revenue_by_month'        => $revenueByMonth,
                'registrations_by_month'  => $registrationsByMonth,
                'peak_hours'              => $peakHours,

                // Real dashboard data
                'monthly_income'          => floatval($monthlyEarnings),
                'monthly_change_percent'  => $monthlyChangePercent,
                'weekly_income'           => floatval($weeklyEarnings),
                'weekly_change_percent'   => $weeklyChangePercent,
                'daily_chart'             => $dailyChart,

                'total_users'             => $totalUsers,
                'new_registrations_week'  => $newRegistrationsThisWeek,
                'registrations_change'    => $registrationsChange,
                'users_by_role'           => $usersByRole,

                'active_subscriptions'    => $activeSubscriptions,
                'expiring_subscriptions'  => $expiringSubscriptions,

                'peak_users_total'        => $peakUsersTotal,

                'categories_count'        => $categoriesCount,
                'products_count'          => $productsCount,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener métricas',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
