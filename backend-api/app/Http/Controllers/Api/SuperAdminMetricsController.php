<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Checkin;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;

class SuperAdminMetricsController extends Controller
{
    public function index(Request $request)
    {
        $months = max(1, (int) $request->query('months', 6));
        $start = now()->subMonths($months - 1)->startOfMonth();

        $revenue = Subscription::query()
            ->selectRaw("DATE_FORMAT(starts_at, '%Y-%m') as month, SUM(price) as total")
            ->where('starts_at', '>=', $start)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $registrations = User::query()
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total")
            ->where('created_at', '>=', $start)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $peakHours = Checkin::query()
            ->selectRaw('HOUR(checked_in_at) as hour, COUNT(*) as total')
            ->where('checked_in_at', '>=', $start)
            ->groupBy('hour')
            ->orderByDesc('total')
            ->limit(6)
            ->get();

        return response()->json([
            'revenue_by_month' => $revenue,
            'registrations_by_month' => $registrations,
            'peak_hours' => $peakHours
        ]);
    }
}
