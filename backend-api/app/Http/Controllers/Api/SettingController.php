<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $scope = $request->query('scope');

        $query = Setting::query();
        if ($scope) {
            $query->where('scope', $scope);
        }

        return response()->json($query->get());
    }

    public function upsert(Request $request)
    {
        $validated = $request->validate([
            'scope' => 'nullable|string|max:64',
            'key' => 'required|string|max:128',
            'value' => 'nullable'
        ]);

        $scope = $validated['scope'] ?? 'global';

        $setting = Setting::updateOrCreate(
            ['scope' => $scope, 'key' => $validated['key']],
            ['value' => $validated['value']]
        );

        return response()->json($setting);
    }
}
