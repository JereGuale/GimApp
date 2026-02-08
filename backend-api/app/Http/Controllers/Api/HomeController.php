<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $subscription = Subscription::with('plan')
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->orderByDesc('starts_at')
            ->first();

        return response()->json([
            'user' => $request->user(),
            'subscription' => $subscription
        ]);
    }
}
