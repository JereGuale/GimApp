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
            // Campos de facturación
            'billing_name' => 'nullable|string|max:255',
            'billing_email' => 'nullable|email',
            'billing_phone' => 'nullable|string|max:20',
            'billing_id_number' => 'nullable|string|max:30',
            'billing_city' => 'nullable|string|max:100',
            'billing_address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar si el usuario ya tiene una suscripción activa o pendiente
        $existing = Subscription::where('user_id', $request->user()->id)
            ->whereIn('status', ['active', 'pending'])
            ->first();

        if ($existing) {
            $statusLabel = $existing->status === 'active' ? 'activa' : 'pendiente de aprobación';
            return response()->json([
                'message' => "Ya tienes una suscripción {$statusLabel}. No puedes suscribirte a otro plan hasta que termine tu periodo actual.",
                'existing_subscription' => $existing->load('plan')
            ], 409);
        }

        $plan = SubscriptionPlan::findOrFail($request->subscription_plan_id);
        $user = $request->user();

        $subscriptionData = [
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'price' => $plan->price,
            'payment_method' => $request->payment_method,
            'billing_name' => $request->input('billing_name') ?: $user->name,
            'billing_email' => $request->input('billing_email') ?: $user->email,
            'billing_phone' => $request->input('billing_phone') ?: $user->phone,
            'billing_id_number' => $request->input('billing_id_number') ?: $user->billing_id_number,
            'billing_city' => $request->input('billing_city') ?: $user->billing_city,
            'billing_address' => $request->input('billing_address') ?: $user->billing_address,
        ];

        if ($request->payment_method === 'card') {
            // En producción, aquí iría integración con pasarela de pago
            // Por ahora, simulamos validación exitosa
            $subscriptionData['card_data'] = json_encode([
                'last_four' => substr($request->card_number, -4),
                'card_name' => $request->card_name,
                'expiry' => $request->card_expiry
            ]);
            $duration = $plan->duration ?? 'monthly';
            $months = 1;
            if ($duration === 'quarterly') { $months = 3; }
            elseif ($duration === 'semiannual') { $months = 6; }
            elseif ($duration === 'annual' || $duration === 'yearly') { $months = 12; }
            elseif (is_numeric($duration)) { $months = (int)$duration; }

            $subscriptionData['status'] = 'active';
            $subscriptionData['starts_at'] = now();
            $subscriptionData['ends_at'] = now()->addDays($months * 30);
            $subscriptionData['approved_at'] = now();
        }
        else {
            // Transferencia -> Pendiente hasta subir comprobante
            $subscriptionData['status'] = 'pending';
        }

        $subscription = Subscription::create($subscriptionData);
        $subscription->load(['plan', 'user']);

        // Si es transferencia, notificar a los admins
        if ($request->payment_method === 'transfer') {
            $subscription->load(['plan', 'user']);
            Notification::notifyAdmins($subscription);
        }
        elseif ($request->payment_method === 'card') {
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

        // Notificar a admins sobre nueva solicitud con comprobante
        $subscription->load(['plan', 'user']);
        Notification::notifyAdmins($subscription);

        return response()->json([
            'message' => 'Comprobante enviado con éxito',
            'subscription' => $subscription
        ]);
    }
}
