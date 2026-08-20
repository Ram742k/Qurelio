<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * GET /api/settings/staff
     * List all staff members for the authenticated tenant with their assigned roles.
     */
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $staff = User::where('tenant_id', $tenantId)
            ->with('roles')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id'         => $user->id,
                    'name'       => $user->name,
                    'email'      => $user->email,
                    'phone'      => $user->phone,
                    'status'     => $user->status,
                    'role'       => $user->getRoleNames()->first() ?? 'front_desk',
                    'created_at' => $user->created_at ? $user->created_at->format('Y-m-d H:i') : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $staff,
        ]);
    }

    /**
     * POST /api/settings/staff
     * Add a new staff member to the clinic tenant and assign role.
     */
    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'phone'    => 'required|string|max:20|unique:users,phone',
            'email'    => 'nullable|email|max:120',
            'password' => 'required|string|min:6',
            'role'     => 'required|string|in:clinic_admin,doctor,front_desk',
        ]);

        $user = User::create([
            'tenant_id' => $tenantId,
            'name'      => $validated['name'],
            'phone'     => $validated['phone'],
            'email'     => $validated['email'] ?? null,
            'password'  => Hash::make($validated['password']),
            'status'    => 'active',
        ]);

        if (class_exists(Role::class)) {
            $user->assignRole($validated['role']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff member created successfully.',
            'data'    => [
                'id'     => $user->id,
                'name'   => $user->name,
                'phone'  => $user->phone,
                'email'  => $user->email,
                'role'   => $validated['role'],
                'status' => $user->status,
            ],
        ], 201);
    }

    /**
     * PUT /api/settings/staff/{user}
     * Update role or status of an existing staff member.
     */
    public function update(Request $request, User $user)
    {
        $tenantId = $request->user()->tenant_id;

        if ($user->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access.'], 403);
        }

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:100',
            'email'  => 'nullable|email|max:120',
            'role'   => 'sometimes|string|in:clinic_admin,doctor,front_desk',
            'status' => 'sometimes|string|in:active,inactive',
        ]);

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (isset($validated['status'])) $user->status = $validated['status'];
        $user->save();

        if (isset($validated['role']) && class_exists(Role::class)) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff details updated successfully.',
            'data'    => [
                'id'     => $user->id,
                'name'   => $user->name,
                'role'   => $user->getRoleNames()->first() ?? 'front_desk',
                'status' => $user->status,
            ],
        ]);
    }
}
