<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Services\SupabaseStorage;

class SubscriptionController extends Controller
{
    /**
     * Get user's current subscription
     */
    public function my(Request $request)
    {
        // Throttle global expired check to once every 10 minutes to eliminate DB latency
        \Illuminate\Support\Facades\Cache::remember('subs_expired_checked', 600, function () {
            return Subscription::updateExpiredStatus();
        });

        $subscription = Subscription::with(['plan', 'approvedBy'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->first();

        if ($subscription && $subscription->status === 'active' && $subscription->ends_at && $subscription->ends_at->isPast()) {
            $subscription->update(['status' => 'expired']);
            $subscription->status = 'expired';
        }

        return response()->json($subscription);
    }

    /**
     * Create new subscription
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'payment_method' => 'required|in:transfer',
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

        // Actualizar suscripciones expiradas antes de verificar
        Subscription::updateExpiredStatus();

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

        // Transferencia -> pendiente hasta que el comprobante sea aprobado.
        $subscriptionData['status'] = 'pending';

        $subscription = Subscription::create($subscriptionData);
        $subscription->load(['plan', 'user']);

        // Si es transferencia, notificar a los admins
        if ($request->payment_method === 'transfer') {
            $subscription->load(['plan', 'user']);
            Notification::notifyAdmins($subscription);
        }

        return response()->json([
            'message' => 'Suscripción creada. Suba su comprobante para activarla',
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

        $receiptFile = $request->file('receipt');
        if (!$receiptFile || !$receiptFile->isValid()) {
            Log::warning('Invalid subscription receipt upload', [
                'subscription_id' => $id,
                'upload_error' => $receiptFile?->getError(),
            ]);
            return response()->json(['message' => 'El comprobante no pudo ser recibido. Intenta nuevamente con una imagen JPG o PNG menor a 5 MB.'], 422);
        }

        $supabase = new SupabaseStorage();
        $path = null;

        try {
            if ($supabase->isConfigured()) {
                $ext = $receiptFile->getClientOriginalExtension() ?: 'jpg';
                $fileName = 'sub_' . $id . '_' . time() . '_' . uniqid() . '.' . $ext;
                $filePath = 'receipts/' . $fileName;
                $path = $supabase->uploadFile($receiptFile, $filePath);
            }
        } catch (\Throwable $exception) {
            Log::error('Subscription receipt storage failed', [
                'subscription_id' => $id,
                'error' => $exception->getMessage(),
            ]);
        }

        if (!$path) {
            // Delete old local receipt if exists
            if ($subscription->payment_receipt && strpos($subscription->payment_receipt, 'http') !== 0 && Storage::disk('public')->exists($subscription->payment_receipt)) {
                Storage::disk('public')->delete($subscription->payment_receipt);
            }
            // Store new local receipt
            try {
                $path = $receiptFile->store('receipts', 'public');
            } catch (\Throwable $exception) {
                Log::error('Subscription receipt local storage failed', [
                    'subscription_id' => $id,
                    'error' => $exception->getMessage(),
                ]);
                return response()->json(['message' => 'No se pudo guardar el comprobante. Intenta nuevamente.'], 500);
            }
        }

        if (!$path) {
            return response()->json(['message' => 'No se pudo guardar el comprobante. Intenta nuevamente.'], 500);
        }

        $subscription->update([
            'payment_receipt' => $path,
            'status' => 'pending' // Asegurar que quede en pendiente
        ]);

        // Refrescar inmediatamente el listado administrativo, sin esperar a que expire su caché.
        \Illuminate\Support\Facades\Cache::forget('trainer_subscriptions_all');
        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_metrics_v2');

        // Notificar a admins sobre nueva solicitud con comprobante
        $subscription->load(['plan', 'user']);
        Notification::notifyAdmins($subscription);

        return response()->json([
            'message' => 'Comprobante enviado con éxito',
            'subscription' => $subscription
        ]);
    }
}
