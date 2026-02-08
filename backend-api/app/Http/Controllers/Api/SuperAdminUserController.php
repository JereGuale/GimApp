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
        $query = User::query()->orderBy('name');

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        return response()->json($query->paginate(20));
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|required|string|in:user,trainer,admin'
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
