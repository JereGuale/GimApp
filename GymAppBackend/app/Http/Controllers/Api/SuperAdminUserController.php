<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;

class SuperAdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->where('is_active', '!=', 0)
            ->orderBy('name');

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        // Si se pide 'all=true' o 'paginate=false' o hay búsqueda activa, devolver lista con estado de suscripción
        if ($request->query('all') === 'true' || $request->query('paginate') === 'false' || $request->filled('search')) {
            $limit = $request->query('limit', 100);
            $users = $query->with(['subscriptions' => function ($subQuery) {
                $subQuery->where('status', 'active')->with('plan');
            }])
            ->limit((int)$limit)
            ->get()
            ->map(function ($user) {
                $activeSub = $user->subscriptions->first();
                $user->has_active_subscription = !is_null($activeSub);
                $user->active_subscription_plan = $activeSub ? ($activeSub->plan->name ?? $activeSub->plan_id ?? 'Plan Activo') : null;
                $user->active_subscription_ends_at = $activeSub ? $activeSub->ends_at : null;
                return $user;
            });

            return response()->json($users);
        }

        return response()->json($query->paginate(20));
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|required|string|in:user,admin',
            'is_active' => 'sometimes|boolean',
            'suspended_until' => 'nullable|date'
        ]);

        $user->update($validated);

        return response()->json($user);
    }

    public function cancelSubscription(string $id)
    {
        $subscription = Subscription::query()
            ->where('user_id', $id)
            ->where('status', 'active')
            ->orderByDesc('starts_at')
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'No active subscription found'], 404);
        }

        $subscription->update([
            'status' => 'canceled',
            'ends_at' => now()
        ]);

        return response()->json(['message' => 'Subscription canceled', 'subscription' => $subscription]);
    }
}
