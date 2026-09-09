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

        // Límite opcional de registros para cargas rápidas
        if ($request->has('limit')) {
            $query->limit((int)$request->limit);
        }

        $subscriptions = $query->orderByDesc('created_at')->get();

        foreach ($subscriptions as $sub) {
            if (empty($sub->billing_phone)) {
                $sub->billing_phone = $sub->resolved_phone;
            }
            if ($sub->user && empty($sub->user->phone) && !empty($sub->resolved_phone)) {
                $sub->user->phone = $sub->resolved_phone;
            }
        }

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
     * Create subscription for a user (manual creation by admin)
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

        $duration = $plan->duration ?? 'monthly';
        $months = 1;
        if ($duration === 'quarterly') { $months = 3; }
        elseif ($duration === 'semiannual') { $months = 6; }
        elseif ($duration === 'annual' || $duration === 'yearly') { $months = 12; }
        elseif (is_numeric($duration)) { $months = (int)$duration; }

        $user = \App\Models\User::find($request->user_id);
        $userPhone = $user?->phone ?? \App\Models\Order::where('user_id', $request->user_id)->whereNotNull('billing_phone')->latest()->value('billing_phone');

        $note = trim($request->input('notes', ''));

        $subData = [
            'user_id' => $request->user_id,
            'subscription_plan_id' => $plan->id,
            'status' => 'active',
            'payment_method' => 'manual', // Indicar que fue creada manualmente
            'price' => $plan->price,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'starts_at' => now(),
            'ends_at' => now()->addDays($months * 30),
            'billing_name' => $user?->name,
            'billing_email' => $user?->email,
            'billing_phone' => $userPhone,
        ];

        if (!empty($note)) {
            if (\Illuminate\Support\Facades\Schema::hasColumn('subscriptions', 'notes')) {
                $subData['notes'] = $note;
            } else {
                $subData['billing_address'] = '[NOTA]: ' . $note;
            }
        }

        $subscription = Subscription::create($subData);

        return response()->json([
            'message' => 'Suscripción creada exitosamente',
            'subscription' => $subscription->load(['user', 'plan'])
        ], 201);
    }

    /**
     * Renew subscription (manual renewal by trainer/admin)
     */
    public function renew(Request $request, $id)
    {
        $subscription = Subscription::with('plan')->findOrFail($id);
        $durationMonths = $subscription->getDurationMonths();

        // If the subscription is active and has not expired yet, extend from ends_at. Otherwise, starts from now.
        $baseDate = ($subscription->status === 'active' && $subscription->ends_at && $subscription->ends_at->isFuture()) 
            ? $subscription->ends_at 
            : now();

        $subscription->update([
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => $baseDate->copy()->addDays($durationMonths * 30),
            'approved_by' => $request->user()->id,
            'approved_at' => now()
        ]);

        return response()->json([
            'message' => 'Suscripción renovada exitosamente',
            'subscription' => $subscription->load(['user', 'plan'])
        ]);
    }

    /**
     * Delete subscription
     */
    public function destroy($id)
    {
        $subscription = Subscription::findOrFail($id);
        $subscription->delete();

        return response()->json([
            'message' => 'Suscripción eliminada exitosamente'
        ]);
    }

    /**
     * Update client phone for subscription & user
     */
    public function updatePhone(Request $request, $id)
    {
        $subscription = Subscription::with('user')->findOrFail($id);
        $phone = trim($request->input('phone', ''));
        if (!empty($phone)) {
            $subscription->update(['billing_phone' => $phone]);
            if ($subscription->user) {
                $subscription->user->update(['phone' => $phone]);
            }
        }
        return response()->json(['message' => 'Teléfono actualizado', 'phone' => $phone]);
    }

    /**
     * Update administrative notes for subscription
     */
    public function updateNotes(Request $request, $id)
    {
        $subscription = Subscription::findOrFail($id);
        $note = trim($request->input('notes', ''));

        if (\Illuminate\Support\Facades\Schema::hasColumn('subscriptions', 'notes')) {
            $subscription->notes = !empty($note) ? $note : null;
        } else {
            $subscription->billing_address = !empty($note) ? ('[NOTA]: ' . $note) : null;
        }
        $subscription->save();

        return response()->json([
            'message' => 'Nota administrativa actualizada',
            'notes' => $subscription->notes,
            'subscription' => $subscription->load(['user', 'plan'])
        ]);
    }
}
