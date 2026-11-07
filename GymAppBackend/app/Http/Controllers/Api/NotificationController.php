<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user
     */
    public function index(Request $request)
    {
        $this->deleteExpiredReadNotifications($request->user()->id);

        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($notifications);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request)
    {
        $this->deleteExpiredReadNotifications($request->user()->id);

        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a specific notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notificación marcada como leída',
            'notification' => $notification
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Todas las notificaciones marcadas como leídas'
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'message' => 'Notificación eliminada'
        ]);
    }

    /**
     * Keep only three days of notifications after the user has seen them.
     */
    private function deleteExpiredReadNotifications(int $userId): void
    {
        Notification::where('user_id', $userId)
            ->whereNotNull('read_at')
            ->where('read_at', '<=', now()->subDays(3))
            ->delete();
    }
}
