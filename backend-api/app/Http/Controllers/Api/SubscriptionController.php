<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SubscriptionController extends Controller
{
    /**
     * Get user's current subscription
     */
    public function my(Request $request)
    {
        $subscription = Subscription::with(['plan', 'approvedBy'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->first();

        return response()->json($subscription);
    }

    /**
     * Create new subscription
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'payment_method' => 'required|in:card,transfer',
            // Si es tarjeta
            'card_number' => 'required_if:payment_method,card',
            'card_name' => 'required_if:payment_method,card',
            'card_expiry' => 'required_if:payment_method,card',
            'card_cvv' => 'required_if:payment_method,card',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $plan = SubscriptionPlan::findOrFail($request->subscription_plan_id);

        $subscriptionData = [
            'user_id' => $request->user()->id,
            'subscription_plan_id' => $plan->id,
            'price' => $plan->price,
            'payment_method' => $request->payment_method,
        ];

        if ($request->payment_method === 'card') {
            // En producción, aquí iría integración con pasarela de pago
            // Por ahora, simulamos validación exitosa
            $subscriptionData['card_data'] = json_encode([
                'last_four' => substr($request->card_number, -4),
                'card_name' => $request->card_name,
                'expiry' => $request->card_expiry
            ]);
            $subscriptionData['status'] = 'active';
            $subscriptionData['starts_at'] = now();
            $subscriptionData['ends_at'] = now()->addMonths($plan->duration ?? 1);
            $subscriptionData['approved_at'] = now();
        }
        else {
            // Transferencia -> Pendiente hasta subir comprobante
            $subscriptionData['status'] = 'pending';
        }

        $subscription = Subscription::create($subscriptionData);
        $subscription->load(['plan', 'user']);

        // Si es transferencia, notificar a los trainers
        if ($request->payment_method === 'transfer') {
            // La notificación se enviará cuando suba el comprobante
        } elseif ($request->payment_method === 'card') {
            // Tarjeta: auto-aprobada, notificar al usuario
            Notification::create([
                'user_id' => $request->user()->id,
                'type' => 'subscription_approved',
                'title' => '¡Suscripción comprada con éxito!',
                'message' => "Tu suscripción al {$subscription->plan->name} ha sido activada exitosamente.",
                'data' => [
                    'subscription_id' => $subscription->id,
                    'plan_name' => $subscription->plan->name,
                    'status' => 'active',
                ],
            ]);
        }

        return response()->json([
            'message' => $request->payment_method === 'card'
            ? 'Suscripción comprada con éxito'
            : 'Suscripción creada. Suba su comprobante para activarla',
            'subscription' => $subscription
        ], 201);
    }

    /**
     * Upload payment receipt (for bank transfers)
     */
    public function uploadReceipt(Request $request, $id)
    {
        $subscription = Subscription::findOrFail($id);

        // Verificar que sea del usuario autenticado
        if ($subscription->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if ($subscription->payment_method !== 'transfer') {
            return response()->json(['message' => 'Solo para transferencias'], 400);
        }

        $validator = Validator::make($request->all(), [
            'receipt' => 'required|image|max:5120' // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Guardar imagen
        $path = $request->file('receipt')->store('receipts', 'public');

        $subscription->update([
            'payment_receipt' => $path,
            'status' => 'pending' // Asegurar que quede en pendiente
        ]);

        // Notificar a trainers sobre nueva solicitud con comprobante
        $subscription->load(['plan', 'user']);
        Notification::notifyTrainers($subscription);

        return response()->json([
            'message' => 'Comprobante enviado con éxito',
            'subscription' => $subscription
        ]);
    }
}
