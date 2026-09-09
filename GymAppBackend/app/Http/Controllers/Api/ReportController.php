<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\DailyIncome;
use App\Models\Subscription;
use Carbon\Carbon;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class ReportController extends Controller
{
    public function dashboard(Request $request)
    {
        // Cache the dashboard data for 1 minute to avoid hammering the DB
        $cacheKey = 'admin_dashboard_metrics_v2';

        $metrics = Cache::remember($cacheKey, 60, function () {
            $today = Carbon::today()->toDateString();
            $month = Carbon::now()->month;
            $year = Carbon::now()->year;

            // 1. Dailies Query: Get Today and Montly aggregates in a single query
            $dailyStats = DailyIncome::selectRaw("
                SUM(CASE WHEN DATE(entry_date) = ? THEN amount ELSE 0 END) as today_income,
                COUNT(CASE WHEN DATE(entry_date) = ? THEN 1 END) as today_count,
                SUM(CASE WHEN EXTRACT(MONTH FROM entry_date) = ? AND EXTRACT(YEAR FROM entry_date) = ? THEN amount ELSE 0 END) as month_income,
                COUNT(CASE WHEN EXTRACT(MONTH FROM entry_date) = ? AND EXTRACT(YEAR FROM entry_date) = ? THEN 1 END) as month_count
            ", [$today, $today, $month, $year, $month, $year])->first();

            // 2. Subscriptions Query: Get active count, this month's earnings, and expired this month
            $subStats = Subscription::selectRaw("
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                SUM(CASE WHEN status = 'active' AND EXTRACT(MONTH FROM starts_at) = ? AND EXTRACT(YEAR FROM starts_at) = ? THEN price ELSE 0 END) as month_earnings,
                COUNT(CASE WHEN status = 'active' AND EXTRACT(MONTH FROM ends_at) = ? AND EXTRACT(YEAR FROM ends_at) = ? AND ends_at < NOW() THEN 1 END) as expired_this_month
            ", [$month, $year, $month, $year])->first();

            $dailyIncomeToday = floatval($dailyStats->today_income ?? 0);
            $dailyCountToday = intval($dailyStats->today_count ?? 0);

            $monthlyDailyEarnings = floatval($dailyStats->month_income ?? 0);
            $clientsAttendedMonthDaily = intval($dailyStats->month_count ?? 0);

            $activeSubscriptions = intval($subStats->active_count ?? 0);
            $monthlySubsEarnings = floatval($subStats->month_earnings ?? 0);
            $expiredThisMonth = intval($subStats->expired_this_month ?? 0);

            $totalMensual = $monthlySubsEarnings + $monthlyDailyEarnings;

            return [
            'ingresosHoy' => $dailyIncomeToday,
            'clientesDiariosHoy' => $dailyCountToday,
            'totalMensual' => $totalMensual,
            'mensualSuscripciones' => $monthlySubsEarnings,
            'mensualPases' => $monthlyDailyEarnings,
            'clientesAtendidosMes' => $clientsAttendedMonthDaily,
            'suscripcionesActivas' => $activeSubscriptions,
            'vencidasEsteMes' => $expiredThisMonth
            ];
        });

        return response()->json($metrics);
    }

    public function daily(Request $request)
    {
        $tz = config('app.timezone', 'America/Guayaquil');
        $date = $request->query('date', Carbon::today($tz)->toDateString());

        $incomes = DailyIncome::whereDate('entry_date', $date)
            ->orderBy('entry_date', 'desc')
            ->get();

        return response()->json([
            'data' => $incomes,
            'total' => $incomes->sum('amount')
        ]);
    }

    public function storeDaily(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'entry_date' => 'nullable'
        ]);

        $tz = config('app.timezone', 'America/Guayaquil');
        $now = Carbon::now($tz);

        if ($request->filled('entry_date')) {
            $inputDate = trim($request->entry_date);
            try {
                if (strlen($inputDate) > 10) {
                    $entryDate = Carbon::parse($inputDate, $tz);
                } else {
                    $parsed = Carbon::parse($inputDate, $tz);
                    if ($parsed->isSameDay($now)) {
                        $entryDate = $now;
                    } else {
                        $entryDate = $parsed->setTime($now->hour, $now->minute, $now->second);
                    }
                }
            } catch (\Exception $e) {
                $entryDate = $now;
            }
        } else {
            $entryDate = $now;
        }

        $income = DailyIncome::create([
            'client_name' => $request->client_name,
            'amount' => $request->amount,
            'entry_date' => $entryDate
        ]);

        return response()->json(['message' => 'Ingreso registrado', 'data' => $income], 201);
    }

    public function monthly(Request $request)
    {
        $month = $request->query('month', Carbon::now()->month);
        $year = $request->query('year', Carbon::now()->year);

        $subscriptions = Subscription::with(['user', 'plan'])
            ->whereMonth('starts_at', $month)
            ->whereYear('starts_at', $year)
            ->orderBy('starts_at', 'desc')
            ->get();

        return response()->json([
            'data' => $subscriptions,
            'total' => $subscriptions->sum('price')
        ]);
    }

    public function deleteDaily($id)
    {
        $income = DailyIncome::find($id);

        if (!$income) {
            return response()->json(['message' => 'Ingreso no encontrado'], 404);
        }

        $income->delete();

        return response()->json(['message' => 'Ingreso eliminado correctamente']);
    }
}
