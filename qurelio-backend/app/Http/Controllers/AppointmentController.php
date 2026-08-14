<?php

namespace App\Http\Controllers;

use App\Jobs\SendAppointmentReminder;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    /**
     * GET /api/appointments
     * Supports filters: date, from, to, doctor_id, patient_id, status
     */
    public function index(Request $request)
    {
        $query = Appointment::with([
            'patient:id,name,phone',
            'doctor:id,name',
        ])->orderBy('scheduled_at');

        // Filter by exact date
        if ($request->filled('date')) {
            $query->whereDate('scheduled_at', $request->date);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('scheduled_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('scheduled_at', '<=', $request->to);
        }

        // Filter by doctor
        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        // Filter by patient
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $appointments = $query->paginate(30);

        return response()->json([
            'success' => true,
            'data' => $appointments,
        ]);
    }

    /**
     * GET /api/appointments/{id}
     */
    public function show(Appointment $appointment)
    {
        $appointment->load(['patient:id,name,phone,gender,age', 'doctor:id,name']);

        return response()->json([
            'success' => true,
            'data' => $appointment,
        ]);
    }

    /**
     * POST /api/appointments
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'   => 'required|integer',
            'doctor_id'    => 'required|integer',
            'scheduled_at' => 'required|date',
            'status'       => 'sometimes|in:booked,checked_in,completed,no_show,cancelled',
        ]);

        $tenantId = auth()->user()->tenant_id;

        // Tenant isolation: verify patient belongs to this tenant
        $patient = Patient::where('id', $validated['patient_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found or does not belong to your clinic.',
            ], 422);
        }

        // Tenant isolation: verify doctor belongs to this tenant and has doctor role
        $doctor = User::where('id', $validated['doctor_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$doctor) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor not found or does not belong to your clinic.',
            ], 422);
        }

        if (!$doctor->hasRole('doctor')) {
            return response()->json([
                'success' => false,
                'message' => 'The selected user is not a registered doctor.',
            ], 422);
        }

        // Booking conflict check: doctor cannot have two blocking appointments at same time
        $conflict = Appointment::where('doctor_id', $validated['doctor_id'])
            ->where('scheduled_at', $validated['scheduled_at'])
            ->whereIn('status', Appointment::BLOCKING_STATUSES)
            ->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Doctor is already booked for this time slot. Please choose a different time.',
            ], 422);
        }

        // Force tenant_id from auth context — never trust frontend
        $appointment = Appointment::create([
            'tenant_id'    => $tenantId,
            'patient_id'   => $validated['patient_id'],
            'doctor_id'    => $validated['doctor_id'],
            'scheduled_at' => $validated['scheduled_at'],
            'status'       => $validated['status'] ?? 'booked',
        ]);

        $appointment->load(['patient:id,name,phone', 'doctor:id,name']);

        // Dispatch reminder job (non-blocking)
        dispatch(new SendAppointmentReminder($appointment->id));

        // Invalidate dashboard cache for today
        app(DashboardService::class)->invalidate($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully.',
            'data'    => $appointment,
        ], 201);
    }

    /**
     * PUT /api/appointments/{id}
     */
    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'scheduled_at' => 'sometimes|date',
            'status'       => 'sometimes|in:booked,checked_in,completed,no_show,cancelled',
            'doctor_id'    => 'sometimes|integer',
        ]);

        $tenantId = auth()->user()->tenant_id;

        // If rescheduling (changing time or doctor), check for conflicts
        if (isset($validated['scheduled_at']) || isset($validated['doctor_id'])) {
            $newTime     = $validated['scheduled_at'] ?? $appointment->scheduled_at->toDateTimeString();
            $newDoctorId = $validated['doctor_id'] ?? $appointment->doctor_id;

            // If changing doctor, verify the new doctor belongs to tenant
            if (isset($validated['doctor_id'])) {
                $doctor = User::where('id', $newDoctorId)
                    ->where('tenant_id', $tenantId)
                    ->first();

                if (!$doctor || !$doctor->hasRole('doctor')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid doctor selected.',
                    ], 422);
                }
            }

            $conflict = Appointment::where('doctor_id', $newDoctorId)
                ->where('scheduled_at', $newTime)
                ->where('id', '!=', $appointment->id)
                ->whereIn('status', Appointment::BLOCKING_STATUSES)
                ->exists();

            if ($conflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'Doctor is already booked for this time slot.',
                ], 422);
            }
        }

        $appointment->update($validated);
        $appointment->load(['patient:id,name,phone', 'doctor:id,name']);

        // Invalidate dashboard cache
        app(DashboardService::class)->invalidate(auth()->user()->tenant_id);

        return response()->json([
            'success' => true,
            'message' => 'Appointment updated successfully.',
            'data'    => $appointment,
        ]);
    }

    /**
     * DELETE /api/appointments/{id}
     * Sets status to cancelled (soft cancel, preserves record)
     */
    public function destroy(Appointment $appointment)
    {
        $appointment->update(['status' => 'cancelled']);

        // Invalidate dashboard cache
        app(DashboardService::class)->invalidate(auth()->user()->tenant_id);

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled successfully.',
        ]);
    }
}


