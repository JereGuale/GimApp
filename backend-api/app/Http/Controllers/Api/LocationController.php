<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index()
    {
        return response()->json(Location::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $location = Location::create($validated);
        return response()->json($location, 201);
    }

    public function show(string $id)
    {
        return response()->json(Location::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $location = Location::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $location->update($validated);
        return response()->json($location);
    }

    public function destroy(string $id)
    {
        $location = Location::findOrFail($id);
        $location->delete();
        return response()->json(['message' => 'Location deleted successfully']);
    }
}
