<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * Create a new product order (client)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|in:transfer,card',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Build order items with current product data and calculate total
        $orderItems = [];
        $total = 0;

        foreach ($request->items as $item) {
            $product = Product::find($item['product_id']);
            if (!$product) {
                return response()->json([
                    'message' => "Producto con ID {$item['product_id']} no encontrado"
                ], 404);
            }

            // Check stock if available
            if ($product->stock !== null && $product->stock < $item['quantity']) {
                return response()->json([
                    'message' => "Stock insuficiente para \"{$product->name}\". Disponible: {$product->stock}"
                ], 422);
            }

            $lineTotal = $product->price * $item['quantity'];
            $total += $lineTotal;

            $orderItems[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'quantity' => $item['quantity'],
                'image' => $product->image_url,
                'line_total' => $lineTotal,
            ];
        }

        $order = Order::create([
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'payment_method' => $request->payment_method,
            'total' => $total,
            'items' => $orderItems,
            'notes' => $request->notes,
        ]);

        $order->load('user');

        // Notify admins about new order
        try {
            Notification::notifyAdminsAboutOrder($order);
        } catch (\Exception $e) {
            Log::warning('Could not notify admins about new order: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pedido creado. Suba su comprobante de pago para procesarlo.',
            'order' => $order,
        ], 201);
    }

    /**
     * Upload payment receipt for an order (client)
     */
    public function uploadReceipt(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        // Verify ownership
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if ($order->payment_method !== 'transfer') {
            return response()->json(['message' => 'Solo para transferencias bancarias'], 400);
        }

        $validator = Validator::make($request->all(), [
            'receipt' => 'required|image|max:5120' // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Delete old receipt if exists
        if ($order->payment_receipt && Storage::disk('public')->exists($order->payment_receipt)) {
            Storage::disk('public')->delete($order->payment_receipt);
        }

        // Store new receipt
        $path = $request->file('receipt')->store('order_receipts', 'public');

        $order->update([
            'payment_receipt' => $path,
            'status' => 'pending', // Ensure it stays pending
        ]);

        // Notify admins
        $order->load('user');
        try {
            Notification::notifyAdminsAboutOrder($order);
        } catch (\Exception $e) {
            Log::warning('Could not notify admins about order receipt: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Comprobante enviado con éxito. Un administrador revisará tu pedido.',
            'order' => $order,
        ]);
    }

    /**
     * Get current user's orders (client)
     */
    public function myOrders(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    /**
     * Get all orders (admin)
     */
    public function index(Request $request)
    {
        $query = Order::with(['user', 'approvedBy']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Search by user name/email
        if ($request->has('search') && $request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $orders = $query->orderByDesc('created_at')->get();

        return response()->json($orders);
    }

    /**
     * Get pending orders count (admin)
     */
    public function pendingCount()
    {
        $count = Order::where('status', 'pending')->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Approve an order (admin)
     */
    public function approve(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden aprobar pedidos pendientes'
            ], 400);
        }

        $order->approve($request->user()->id);

        // Decrement stock for each product
        foreach ($order->items as $item) {
            $product = Product::find($item['product_id']);
            if ($product && $product->stock !== null) {
                $newStock = max(0, $product->stock - $item['quantity']);
                $product->update(['stock' => $newStock]);
            }
        }

        // Notify user
        $order->load('user');
        try {
            Notification::create([
                'user_id' => $order->user_id,
                'type' => 'order_approved',
                'title' => '¡Pedido aprobado!',
                'message' => "Tu pedido #$order->id por \${$order->total} ha sido aprobado.",
                'data' => [
                    'order_id' => $order->id,
                    'status' => 'approved',
                ],
            ]);
        } catch (\Exception $e) {
            Log::warning('Could not notify user about order approval: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pedido aprobado exitosamente',
            'order' => $order->load(['user', 'approvedBy']),
        ]);
    }

    /**
     * Reject an order (admin)
     */
    public function reject(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden rechazar pedidos pendientes'
            ], 400);
        }

        $reason = $request->reason ?? 'Pedido rechazado por el administrador';
        $order->reject($reason);

        // Notify user
        try {
            Notification::create([
                'user_id' => $order->user_id,
                'type' => 'order_rejected',
                'title' => 'Pedido rechazado',
                'message' => "Tu pedido #$order->id fue rechazado. Razón: $reason",
                'data' => [
                    'order_id' => $order->id,
                    'status' => 'rejected',
                    'reason' => $reason,
                ],
            ]);
        } catch (\Exception $e) {
            Log::warning('Could not notify user about order rejection: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Pedido rechazado',
            'order' => $order->load(['user', 'approvedBy']),
        ]);
    }
}
