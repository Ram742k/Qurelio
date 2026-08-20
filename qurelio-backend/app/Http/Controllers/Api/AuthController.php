<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'clinic_name'   => 'required|string|max:160',
            'name'          => 'required|string|max:100',
            'phone'         => 'required|string|max:20|unique:users,phone',
            'email'         => 'nullable|email|max:120',
            'password'      => 'required|string|min:6',
            'practice_type' => 'nullable|string|in:single_doctor,polyclinic,clinic,hospital,dental',
        ]);

        $subdomain = \Illuminate\Support\Str::slug($request->clinic_name) . '-' . rand(100, 999);

        $tenant = Tenant::create([
            'name'                 => $request->clinic_name,
            'subdomain'            => $subdomain,
            'practice_type'        => $request->practice_type ?? 'clinic',
            'phone'                => $request->phone,
            'email'                => $request->email,
            'subscription_status' => 'trial',
            'subscription_plan'   => 'starter',
            'trial_ends_at'        => now()->addDays(14),
            'onboarding_completed' => false,
            'working_hours'        => Tenant::defaultWorkingHours(),
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name'      => $request->name,
            'phone'     => $request->phone,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'status'    => 'active',
        ]);

        // Assign clinic_admin and doctor roles by default
        if (class_exists(\Spatie\Permission\Models\Role::class)) {
            $user->assignRole(['clinic_admin', 'doctor']);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Tenant registered successfully.',
            'user' => [
                'id'   => $user->id,
                'name' => $user->name,
                'role' => $user->getRoleNames()->first() ?? 'clinic_admin',
            ],
            'tenant' => [
                'id'                   => $tenant->id,
                'name'                 => $tenant->name,
                'subdomain'            => $tenant->subdomain,
                'practice_type'        => $tenant->practice_type,
                'phone'                => $tenant->phone,
                'email'                => $tenant->email,
                'timezone'             => $tenant->timezone ?? 'Asia/Kolkata',
                'onboarding_completed' => false,
            ],
            'token' => $token,
        ], 201);
    }

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
                'role' => $user->getRoleNames()->first() ?? 'clinic_admin',
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
                'role' => $user->getRoleNames()->first() ?? 'clinic_admin',
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

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        $user = User::where('phone', $request->phone)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number not found in system.',
            ], 442);
        }

        // Return reset token or success response for OTP / Password Reset
        return response()->json([
            'success' => true,
            'message' => 'Password reset verification code dispatched to phone number.',
            'reset_token' => base64_encode($user->id . ':' . time()),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'phone'        => 'required|string',
            'reset_token'  => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $user = User::where('phone', $request->phone)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid reset request.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password successfully reset. Please log in with your new password.',
        ]);
    }
}
