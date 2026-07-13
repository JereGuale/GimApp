<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Checkin;
use Illuminate\Http\Request;

class CheckinController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'location_id' => 'nullable|exists:locations,id',
            'checked_in_at' => 'nullable|date'
        ]);

        $checkin = Checkin::create([
            'user_id' => $request->user()->id,
            'location_id' => $validated['location_id'] ?? null,
            'checked_in_at' => $validated['checked_in_at'] ?? now()
        ]);

        return response()->json($checkin, 201);
    }
}
