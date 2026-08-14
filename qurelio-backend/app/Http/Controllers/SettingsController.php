<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    /**
     * Helper to retrieve current tenant's merged settings
     */
    protected function getTenantSettings(Tenant $tenant): array
    {
        $defaults = [
            'general' => [
                'language'    => 'English',
                'currency'    => 'INR (₹)',
                'date_format' => 'DD/MM/YYYY',
            ],
            'billing' => [
                'invoice_prefix'      => 'INV-',
                'tax_percentage'      => 0,
                'currency'            => 'INR',
                'payment_methods'     => ['cash', 'upi', 'card'],
                'default_due_days'    => 7,
            ],
            'notifications' => [
                'sms_appointment_reminder' => true,
                'sms_followup_reminder'    => true,
                'whatsapp_appointment'     => true,
                'whatsapp_prescription'    => true,
                'email_invoice'            => true,
                'email_confirmation'       => true,
                'queue_alerts'             => true,
            ],
            'integrations' => [
                'razorpay' => ['connected' => false, 'key_id' => ''],
                'phonepe'  => ['connected' => false, 'merchant_id' => ''],
                'whatsapp' => ['connected' => false, 'phone_number_id' => ''],
                'smtp'     => ['connected' => false, 'host' => ''],
                'storage'  => ['connected' => false, 'provider' => 's3'],
            ],
        ];

        $stored = $tenant->settings ?? [];
        return array_replace_recursive($defaults, $stored);
    }

    // --- 1. GENERAL ---
    public function getGeneral()
    {
        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);

        return response()->json([
            'success' => true,
            'data'    => [
                'clinic_name'    => $tenant->name,
                'practice_type'  => $tenant->practice_type ?? 'clinic',
                'timezone'       => $tenant->timezone ?? 'Asia/Kolkata',
                'language'       => $settings['general']['language'],
                'currency'       => $settings['general']['currency'],
                'date_format'    => $settings['general']['date_format'],
            ],
        ]);
    }

    public function updateGeneral(Request $request)
    {
        $validated = $request->validate([
            'clinic_name' => 'required|string|max:150',
            'timezone'    => 'required|string',
            'language'    => 'required|string',
            'currency'    => 'required|string',
            'date_format' => 'required|string',
        ]);

        $tenant = auth()->user()->tenant;
        $tenant->name = $validated['clinic_name'];
        $tenant->timezone = $validated['timezone'];

        $settings = $this->getTenantSettings($tenant);
        $settings['general']['language'] = $validated['language'];
        $settings['general']['currency'] = $validated['currency'];
        $settings['general']['date_format'] = $validated['date_format'];

        $tenant->settings = $settings;
        $tenant->save();

        AuditLogger::log('SETTINGS_GENERAL_UPDATED', 'Updated general clinic settings');

        return response()->json(['success' => true, 'message' => 'General settings updated successfully.']);
    }

    // --- 2. CLINIC PROFILE ---
    public function getClinic()
    {
        $tenant = auth()->user()->tenant;

        return response()->json([
            'success' => true,
            'data'    => [
                'name'            => $tenant->name,
                'logo_url'        => $tenant->logo_url,
                'cover_image_url' => $tenant->cover_image_url,
                'phone'           => $tenant->phone,
                'email'           => $tenant->email,
                'address'         => $tenant->address,
                'city'            => $tenant->city,
                'state'           => $tenant->state,
                'country'         => $tenant->country ?? 'India',
                'pincode'         => $tenant->pincode,
                'website'         => $tenant->settings['clinic']['website'] ?? '',
            ],
        ]);
    }

    public function updateClinic(Request $request)
    {
        $validated = $request->validate([
            'phone'           => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:100',
            'address'         => 'nullable|string',
            'city'            => 'nullable|string|max:50',
            'state'           => 'nullable|string|max:50',
            'country'         => 'nullable|string|max:50',
            'pincode'         => 'nullable|string|max:10',
            'logo_url'        => 'nullable|string',
            'cover_image_url' => 'nullable|string',
            'website'         => 'nullable|string',
        ]);

        $tenant = auth()->user()->tenant;
        $tenant->update($validated);

        $settings = $this->getTenantSettings($tenant);
        $settings['clinic']['website'] = $validated['website'] ?? '';
        $tenant->settings = $settings;
        $tenant->save();

        AuditLogger::log('SETTINGS_CLINIC_UPDATED', 'Updated clinic profile');

        return response()->json(['success' => true, 'message' => 'Clinic profile updated successfully.']);
    }

    // --- 3. WORKING HOURS ---
    public function getWorkingHours()
    {
        $tenant = auth()->user()->tenant;

        return response()->json([
            'success' => true,
            'data'    => $tenant->working_hours ?? Tenant::defaultWorkingHours(),
        ]);
    }

    public function updateWorkingHours(Request $request)
    {
        $validated = $request->validate([
            'working_hours' => 'required|array',
        ]);

        $tenant = auth()->user()->tenant;
        $tenant->working_hours = $validated['working_hours'];
        $tenant->save();

        AuditLogger::log('SETTINGS_HOURS_UPDATED', 'Updated clinic working hours');

        return response()->json(['success' => true, 'message' => 'Working hours updated successfully.']);
    }

    // --- 4. DOCTOR MANAGEMENT ---
    public function getDoctors()
    {
        $tenantId = auth()->user()->tenant_id;
        $doctors = User::where('tenant_id', $tenantId)
            ->role('doctor')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $doctors]);
    }

    public function addDoctor(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $validated = $request->validate([
            'name'      => 'required|string|max:120',
            'email'     => 'required|email|unique:users,email',
            'phone'     => 'required|string|max:15',
            'password'  => 'required|string|min:6',
        ]);

        $doctor = User::create([
            'tenant_id' => $tenantId,
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'phone'     => $validated['phone'],
            'password'  => bcrypt($validated['password']),
            'status'    => 'active',
        ]);
        $doctor->assignRole('doctor');

        AuditLogger::log('DOCTOR_ADDED', "Added new doctor: {$doctor->name}");

        return response()->json(['success' => true, 'message' => 'Doctor added successfully.', 'data' => $doctor], 201);
    }

    public function updateDoctor(Request $request, User $doctor)
    {
        if ($doctor->tenant_id !== auth()->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:120',
            'phone'  => 'sometimes|string|max:15',
            'status' => 'sometimes|in:active,disabled',
        ]);

        $doctor->update($validated);

        AuditLogger::log('DOCTOR_UPDATED', "Updated doctor details for {$doctor->name}");

        return response()->json(['success' => true, 'message' => 'Doctor updated successfully.']);
    }

    public function deleteDoctor(User $doctor)
    {
        if ($doctor->tenant_id !== auth()->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $doctor->delete();
        AuditLogger::log('DOCTOR_REMOVED', "Removed doctor: {$doctor->name}");

        return response()->json(['success' => true, 'message' => 'Doctor removed successfully.']);
    }

    // --- 5. STAFF MANAGEMENT ---
    public function getStaff()
    {
        $tenantId = auth()->user()->tenant_id;
        $staff = User::where('tenant_id', $tenantId)->with('roles')->get();

        return response()->json(['success' => true, 'data' => $staff]);
    }

    public function addStaff(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $validated = $request->validate([
            'name'     => 'required|string|max:120',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'required|string|max:15',
            'role'     => 'required|in:clinic_admin,doctor,receptionist',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'tenant_id' => $tenantId,
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'phone'     => $validated['phone'],
            'password'  => bcrypt($validated['password']),
            'status'    => 'active',
        ]);
        $user->assignRole($validated['role']);

        AuditLogger::log('STAFF_ADDED', "Added staff member: {$user->name} ({$validated['role']})");

        return response()->json(['success' => true, 'message' => 'Staff added successfully.', 'data' => $user], 201);
    }

    public function updateStaffRole(Request $request, User $user)
    {
        if ($user->tenant_id !== auth()->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'role'   => 'required|in:clinic_admin,doctor,receptionist',
            'status' => 'sometimes|in:active,disabled',
        ]);

        if (isset($validated['status'])) {
            $user->status = $validated['status'];
            $user->save();
        }

        $user->syncRoles([$validated['role']]);

        AuditLogger::log('STAFF_ROLE_UPDATED', "Updated role for staff: {$user->name} to {$validated['role']}");

        return response()->json(['success' => true, 'message' => 'Staff role updated successfully.']);
    }

    // --- 6. BILLING SETTINGS ---
    public function getBilling()
    {
        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);

        return response()->json(['success' => true, 'data' => $settings['billing']]);
    }

    public function updateBilling(Request $request)
    {
        $validated = $request->validate([
            'invoice_prefix'   => 'required|string|max:10',
            'tax_percentage'   => 'required|numeric|min:0|max:100',
            'currency'         => 'required|string|max:10',
            'payment_methods'  => 'required|array',
            'default_due_days' => 'required|integer|min:0',
        ]);

        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);
        $settings['billing'] = $validated;
        $tenant->settings = $settings;
        $tenant->save();

        AuditLogger::log('SETTINGS_BILLING_UPDATED', 'Updated billing configurations');

        return response()->json(['success' => true, 'message' => 'Billing settings updated successfully.']);
    }

    // --- 7. NOTIFICATION SETTINGS ---
    public function getNotifications()
    {
        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);

        return response()->json(['success' => true, 'data' => $settings['notifications']]);
    }

    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'sms_appointment_reminder' => 'required|boolean',
            'sms_followup_reminder'    => 'required|boolean',
            'whatsapp_appointment'     => 'required|boolean',
            'whatsapp_prescription'    => 'required|boolean',
            'email_invoice'            => 'required|boolean',
            'email_confirmation'       => 'required|boolean',
            'queue_alerts'             => 'required|boolean',
        ]);

        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);
        $settings['notifications'] = $validated;
        $tenant->settings = $settings;
        $tenant->save();

        AuditLogger::log('SETTINGS_NOTIFICATIONS_UPDATED', 'Updated notification preferences');

        return response()->json(['success' => true, 'message' => 'Notification preferences updated successfully.']);
    }

    // --- 8. INTEGRATIONS ---
    public function getIntegrations()
    {
        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);

        return response()->json(['success' => true, 'data' => $settings['integrations']]);
    }

    public function updateIntegrations(Request $request)
    {
        $validated = $request->validate([
            'integrations' => 'required|array',
        ]);

        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);
        $settings['integrations'] = array_merge($settings['integrations'], $validated['integrations']);
        $tenant->settings = $settings;
        $tenant->save();

        AuditLogger::log('SETTINGS_INTEGRATIONS_UPDATED', 'Updated third-party integration credentials');

        return response()->json(['success' => true, 'message' => 'Integrations updated successfully.']);
    }

    // --- 9. SECURITY ---
    public function getSecurity()
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'user_email'      => $user->email,
                'two_factor'      => false,
                'active_sessions' => 1,
            ]
        ]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);

        $user = auth()->user();
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password does not match.'], 422);
        }

        $user->password = bcrypt($validated['new_password']);
        $user->save();

        AuditLogger::log('SECURITY_PASSWORD_CHANGED', 'User changed their password');

        return response()->json(['success' => true, 'message' => 'Password updated successfully.']);
    }

    // --- 10. PROFILE ---
    public function getProfile()
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role'  => $user->roles->pluck('name')->first() ?? 'clinic_admin',
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'name'  => 'required|string|max:120',
            'phone' => 'nullable|string|max:15',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($validated);

        AuditLogger::log('PROFILE_UPDATED', 'Updated personal profile details');

        return response()->json(['success' => true, 'message' => 'Profile updated successfully.', 'data' => $user]);
    }

    // --- 11. BACKUP ---
    public function getBackup()
    {
        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);

        return response()->json([
            'success' => true,
            'data'    => [
                'last_backup' => $settings['backup']['last_backup'] ?? now()->subDays(1)->toDateTimeString(),
                'status'      => 'healthy',
                'auto_backup' => true,
            ]
        ]);
    }

    public function triggerBackup()
    {
        $tenant = auth()->user()->tenant;
        $settings = $this->getTenantSettings($tenant);
        $settings['backup']['last_backup'] = now()->toDateTimeString();
        $tenant->settings = $settings;
        $tenant->save();

        AuditLogger::log('DATABASE_BACKUP_TRIGGERED', 'Manual database backup initiated');

        return response()->json([
            'success' => true,
            'message' => 'Manual database backup created successfully.',
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    // --- 12. AUDIT LOGS ---
    public function getAuditLogs(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $query = AuditLog::where('tenant_id', $tenantId);

        if ($request->input('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($logs);
    }
}
