<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use App\Models\Patient;
use App\Models\Appointment;
use App\Jobs\SendFollowupReminderJob;
use Illuminate\Http\Request;

class VisitController extends Controller
{
    /**
     * GET /api/patients/{patient}/visits
     * List all consultation encounters for a patient chronologically.
     */
    public function patientVisits(Request $request, Patient $patient)
    {
        $tenantId = $request->user()->tenant_id;

        if ($patient->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $visits = Visit::where('tenant_id', $tenantId)
            ->where('patient_id', $patient->id)
            ->with(['doctor:id,name', 'prescription'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $visits,
        ]);
    }

    /**
     * POST /api/visits
     * Store a new doctor-patient encounter (Visit).
     */
    public function store(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $doctorId = $request->user()->id;

        $validated = $request->validate([
            'patient_id'       => 'required|exists:patients,id',
            'appointment_id'   => 'nullable|exists:appointments,id',
            'vitals'           => 'nullable|array',
            'vitals.bp'        => 'nullable|string',
            'vitals.pulse'     => 'nullable|string',
            'vitals.temp'      => 'nullable|string',
            'vitals.weight'    => 'nullable|string',
            'chief_complaints' => 'nullable|string',
            'diagnosis'        => 'nullable|string',
            'clinical_notes'   => 'nullable|string',
            'prescription_id'  => 'nullable|exists:prescriptions,id',
            'follow_up_date'   => 'nullable|date|after_or_equal:today',
        ]);

        $patient = Patient::findOrFail($validated['patient_id']);
        if ($patient->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized patient.'], 403);
        }

        $visit = Visit::create([
            'tenant_id'        => $tenantId,
            'patient_id'       => $patient->id,
            'doctor_id'        => $doctorId,
            'appointment_id'   => $validated['appointment_id'] ?? null,
            'vitals'           => $validated['vitals'] ?? null,
            'chief_complaints' => $validated['chief_complaints'] ?? null,
            'diagnosis'        => $validated['diagnosis'] ?? null,
            'clinical_notes'   => $validated['clinical_notes'] ?? null,
            'prescription_id'  => $validated['prescription_id'] ?? null,
            'follow_up_date'   => $validated['follow_up_date'] ?? null,
            'status'           => 'completed',
        ]);

        // If linked to an appointment, mark appointment as completed
        if (!empty($validated['appointment_id'])) {
            $appointment = Appointment::find($validated['appointment_id']);
            if ($appointment && $appointment->tenant_id === $tenantId) {
                $appointment->update(['status' => 'completed']);
            }
        }

        // Module 10 integration: Dispatch Redis queue job for scheduled follow-up reminder if date is set
        if (!empty($validated['follow_up_date'])) {
            SendFollowupReminderJob::dispatch($visit->id)
                ->delay(now()->parse($validated['follow_up_date'])->startOfDay());
        }

        return response()->json([
            'success' => true,
            'message' => 'Consultation visit recorded successfully.',
            'data'    => $visit->load(['patient:id,name,phone', 'doctor:id,name', 'prescription']),
        ], 201);
    }

    /**
     * GET /api/visits/{visit}
     * Get specific visit encounter details.
     */
    public function show(Request $request, Visit $visit)
    {
        if ($visit->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $visit->load(['patient', 'doctor:id,name', 'prescription']),
        ]);
    }
}
