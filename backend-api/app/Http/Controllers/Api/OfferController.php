<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function index()
    {
        return response()->json(Offer::orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'required|string|max:2048',
            'is_image_only' => 'nullable|boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $offer = Offer::create($validated);
        return response()->json($offer, 201);
    }

    public function show(string $id)
    {
        return response()->json(Offer::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $offer = Offer::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'subtitle' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'sometimes|required|string|max:2048',
            'is_image_only' => 'nullable|boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $offer->update($validated);
        return response()->json($offer);
    }

    public function destroy(string $id)
    {
        $offer = Offer::findOrFail($id);
        $offer->delete();
        return response()->json(['message' => 'Offer deleted successfully']);
    }

    public function active()
    {
        $now = now();

        $offer = Offer::query()
            ->where('status', 'active')
            ->where(function ($query) use ($now) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->orderByDesc('created_at')
            ->first();

        return response()->json($offer);
    }
}
