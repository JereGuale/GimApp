<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrainerSubscriptionController extends Controller
{
    /**
     * Get all subscriptions (filterable)
     */
    public function index(Request $request)
    {
        $query = Subscription::with(['user', 'plan', 'approvedBy']);

        // Filtrar por estado
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrar por plan
        if ($request->has('plan_id')) {
            $query->where('subscription_plan_id', $request->plan_id);
        }

        // Búsqueda por usuario
        if ($request->has('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $subscriptions = $query->orderByDesc('created_at')->get();

        return response()->json($subscriptions);
    }

    /**
     * Get pending subscriptions count
     */
    public function pendingCount()
    {
        $count = Subscription::where('status', 'pending')->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Approve subscription
     */
    public function approve(Request $request, $id)
    {
        $subscription = Subscription::findOrFail($id);

        if ($subscription->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden aprobar suscripciones pendientes'
            ], 400);
        }

        $subscription->approve($request->user()->id);
        $subscription->load(['user', 'plan']);

        // Notificar al usuario que su suscripción fue aprobada
        Notification::notifyUser($subscription, 'active');

        return response()->json([
            'message' => 'Suscripción aprobada exitosamente',
            'subscription' => $subscription
        ]);
    }

    /**
     * Reject subscription
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subscription = Subscription::findOrFail($id);

        if ($subscription->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden rechazar suscripciones pendientes'
            ], 400);
        }

        $subscription->reject($request->reason ?? 'Comprobante no válido');
        $subscription->load(['user', 'plan']);

        // Notificar al usuario que su suscripción fue rechazada
        Notification::notifyUser($subscription, 'rejected');

        return response()->json([
            'message' => 'Suscripción rechazada',
            'subscription' => $subscription
        ]);
    }

    /**
     * Create subscription for a user (manual creation by trainer)
     */
    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'subscription_plan_id' => 'required|exists:subscription_plans,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar si el usuario ya tiene una suscripción activa
        $existingSubscription = Subscription::where('user_id', $request->user_id)
            ->where('status', 'active')
            ->first();

        if ($existingSubscription) {
            return response()->json([
                'message' => 'El usuario ya tiene una suscripción activa'
            ], 400);
        }

        $plan = \App\Models\SubscriptionPlan::findOrFail($request->subscription_plan_id);

        $subscription = Subscription::create([
            'user_id' => $request->user_id,
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
            'payment_method' => 'manual', // Indicar que fue creada manualmente
            'price' => $plan->price,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'starts_at' => now(),
            'ends_at' => now()->addDays(30) // 30 días de duración
        ]);

        return response()->json([
            'message' => 'Suscripción creada exitosamente',
            'subscription' => $subscription->load(['user', 'plan'])
        ], 201);
    }
}
