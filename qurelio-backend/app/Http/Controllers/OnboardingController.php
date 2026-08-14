<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OnboardingController extends Controller
{
    /**
     * GET /api/onboarding
     * Return current onboarding state for authenticated tenant.
     */
    public function index(Request $request)
    {
        $tenant = auth()->user()->tenant;

        return response()->json([
            'success' => true,
            'data'    => [
                'onboarding_completed' => $tenant->onboarding_completed,
                'clinic' => [
                    'name'     => $tenant->name,
                    'phone'    => $tenant->phone,
                    'email'    => $tenant->email,
                    'address'  => $tenant->address,
                    'city'     => $tenant->city,
                    'state'    => $tenant->state,
                    'country'  => $tenant->country,
                    'pincode'  => $tenant->pincode,
                    'timezone' => $tenant->timezone ?? 'Asia/Kolkata',
                    'logo_url' => $tenant->logo_url,
                ],
                'working_hours' => $tenant->working_hours ?? Tenant::defaultWorkingHours(),
            ],
        ]);
    }

    /**
     * PUT /api/onboarding/clinic
     * Save clinic details step.
     */
    public function saveClinic(Request $request)
    {
        $user   = auth()->user();
        $tenant = $user->tenant;

        $validated = $request->validate([
            'name'     => 'required|string|max:160',
            'phone'    => 'nullable|string|max:20',
            'email'    => 'nullable|email|max:120',
            'address'  => 'nullable|string|max:400',
            'city'     => 'nullable|string|max:80',
            'state'    => 'nullable|string|max:80',
            'country'  => 'nullable|string|max:80',
            'pincode'  => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:100',
        ]);

        $tenant->update(array_filter($validated, fn($v) => !is_null($v)));

        return response()->json([
            'success' => true,
            'message' => 'Clinic details saved.',
            'data'    => [
                'name'     => $tenant->fresh()->name,
                'phone'    => $tenant->phone,
                'email'    => $tenant->email,
                'address'  => $tenant->address,
                'city'     => $tenant->city,
                'state'    => $tenant->state,
                'country'  => $tenant->country,
                'pincode'  => $tenant->pincode,
                'timezone' => $tenant->timezone,
            ],
        ]);
    }

    /**
     * PUT /api/onboarding/working-hours
     * Save working hours step.
     */
    public function saveWorkingHours(Request $request)
    {
        $tenant = auth()->user()->tenant;

        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        $validated = $request->validate([
            'working_hours'          => 'required|array',
            'working_hours.*.open'   => 'required|boolean',
            'working_hours.*.start'  => 'nullable|string|max:10',
            'working_hours.*.end'    => 'nullable|string|max:10',
        ]);

        $hours = $validated['working_hours'];

        // Sanitize: only allow known day keys, validate open days have start/end
        $sanitized = [];
        foreach ($days as $day) {
            $dayData = $hours[$day] ?? ['open' => false, 'start' => '09:00', 'end' => '18:00'];
            $isOpen  = (bool) ($dayData['open'] ?? false);

            if ($isOpen) {
                if (empty($dayData['start']) || empty($dayData['end'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "Please provide opening and closing times for " . ucfirst($day) . ".",
                    ], 422);
                }

                if (strtotime($dayData['end']) <= strtotime($dayData['start'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "Closing time must be after opening time for " . ucfirst($day) . ".",
                    ], 422);
                }
            }

            $sanitized[$day] = [
                'open'  => $isOpen,
                'start' => $dayData['start'] ?? '09:00',
                'end'   => $dayData['end'] ?? '18:00',
            ];
        }

        $tenant->update(['working_hours' => $sanitized]);

        return response()->json([
            'success' => true,
            'message' => 'Working hours saved.',
            'data'    => ['working_hours' => $sanitized],
        ]);
    }

    /**
     * POST /api/onboarding/complete
     * Finalize onboarding, validate completeness, mark as done.
     */
    public function complete(Request $request)
    {
        $tenant = auth()->user()->tenant;

        // Validate clinic name at minimum before allowing completion
        if (empty($tenant->name)) {
            return response()->json([
                'success' => false,
                'message' => 'Please complete clinic details before finishing setup.',
            ], 422);
        }

        // Ensure working hours are set — use defaults if missing
        if (empty($tenant->working_hours)) {
            $tenant->working_hours = Tenant::defaultWorkingHours();
        }

        $tenant->onboarding_completed = true;
        $tenant->save();

        // Invalidate dashboard cache so the fresh tenant data is picked up
        app(DashboardService::class)->invalidate($tenant->id);

        return response()->json([
            'success' => true,
            'message' => 'Clinic setup complete! Welcome to Qurelio.',
            'data'    => [
                'onboarding_completed' => true,
                'tenant_name'          => $tenant->name,
            ],
        ]);
    }
}
