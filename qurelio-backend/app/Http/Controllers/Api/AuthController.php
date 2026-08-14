<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('phone', $request->phone)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['Invalid credentials.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'phone' => ['This account has been disabled.'],
            ]);
        }

        $tenant = $user->tenant;

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id'   => $user->id,
                'name' => $user->name,
                'role' => $user->getRoleNames()->first(),
            ],
            'tenant' => [
                'id'                   => $tenant->id,
                'name'                 => $tenant->name,
                'practice_type'        => $tenant->practice_type,
                'phone'                => $tenant->phone,
                'email'                => $tenant->email,
                'timezone'             => $tenant->timezone ?? 'Asia/Kolkata',
                'onboarding_completed' => (bool) $tenant->onboarding_completed,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => [
                'id'   => $user->id,
                'name' => $user->name,
                'role' => $user->getRoleNames()->first(),
            ],
            'tenant' => [
                'id'                   => $user->tenant->id,
                'name'                 => $user->tenant->name,
                'practice_type'        => $user->tenant->practice_type,
                'phone'                => $user->tenant->phone,
                'email'                => $user->tenant->email,
                'timezone'             => $user->tenant->timezone ?? 'Asia/Kolkata',
                'onboarding_completed' => (bool) $user->tenant->onboarding_completed,
            ],
        ]);
    }
}
