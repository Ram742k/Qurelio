<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    /**
     * GET /api/prescriptions
     * List prescriptions for current tenant with filters and pagination.
     */
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $query = Prescription::with([
            'patient:id,name,phone,gender,age',
            'doctor:id,name',
            'appointment:id,scheduled_at,status',
        ])
        ->where('tenant_id', $tenantId)
        ->orderBy('created_at', 'desc');

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('patient', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('doctor', function ($dq) use ($search) {
                    $dq->where('name', 'like', "%{$search}%");
                })
                ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $prescriptions = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $prescriptions,
        ]);
    }

    /**
     * POST /api/prescriptions
     * Create a new prescription.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'             => 'required|integer',
            'doctor_id'              => 'required|integer',
            'appointment_id'         => 'nullable|integer',
            'medicines'              => 'required|array|min:1',
            'medicines.*.name'       => 'required|string|max:255',
            'medicines.*.dosage'     => 'nullable|string|max:100',
            'medicines.*.frequency'  => 'nullable|string|max:100',
            'medicines.*.duration'   => 'nullable|string|max:100',
            'medicines.*.instructions' => 'nullable|string|max:500',
            'notes'                  => 'nullable|string|max:2000',
        ]);

        $tenantId = auth()->user()->tenant_id;

        // Verify patient belongs to tenant
        $patient = Patient::where('id', $validated['patient_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found or does not belong to your clinic.',
            ], 422);
        }

        // Verify doctor belongs to tenant and has doctor role
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

        // Validate appointment if provided
        if (!empty($validated['appointment_id'])) {
            $appointment = Appointment::where('id', $validated['appointment_id'])
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment not found or does not belong to your clinic.',
                ], 422);
            }

            if ($appointment->patient_id != $validated['patient_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment does not belong to the specified patient.',
                ], 422);
            }

            if ($appointment->doctor_id != $validated['doctor_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment does not belong to the specified doctor.',
                ], 422);
            }
        }

        // Sanitize medicines data to ensure uniform keys
        $medicines = array_map(function ($med) {
            return [
                'name'         => trim($med['name']),
                'dosage'       => isset($med['dosage']) ? trim($med['dosage']) : '',
                'frequency'    => isset($med['frequency']) ? trim($med['frequency']) : '',
                'duration'     => isset($med['duration']) ? trim($med['duration']) : '',
                'instructions' => isset($med['instructions']) ? trim($med['instructions']) : '',
            ];
        }, $validated['medicines']);

        $prescription = Prescription::create([
            'tenant_id'      => $tenantId,
            'patient_id'     => $validated['patient_id'],
            'doctor_id'      => $validated['doctor_id'],
            'appointment_id' => $validated['appointment_id'] ?? null,
            'medicines'      => $medicines,
            'notes'          => $validated['notes'] ?? null,
        ]);

        $prescription->load([
            'patient:id,name,phone,gender,age',
            'doctor:id,name',
            'appointment:id,scheduled_at,status',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prescription created successfully.',
            'data'    => $prescription,
        ], 201);
    }

    /**
     * GET /api/prescriptions/{id}
     * Show detailed prescription.
     */
    public function show(Prescription $prescription)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($prescription->tenant_id !== $tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $prescription->load([
            'patient:id,name,phone,gender,age',
            'doctor:id,name',
            'appointment:id,scheduled_at,status',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $prescription,
        ]);
    }

    /**
     * PUT /api/prescriptions/{id}
     * Update an existing prescription.
     */
    public function update(Request $request, Prescription $prescription)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($prescription->tenant_id !== $tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $validated = $request->validate([
            'patient_id'             => 'sometimes|integer',
            'doctor_id'              => 'sometimes|integer',
            'appointment_id'         => 'nullable|integer',
            'medicines'              => 'sometimes|array|min:1',
            'medicines.*.name'       => 'required_with:medicines|string|max:255',
            'medicines.*.dosage'     => 'nullable|string|max:100',
            'medicines.*.frequency'  => 'nullable|string|max:100',
            'medicines.*.duration'   => 'nullable|string|max:100',
            'medicines.*.instructions' => 'nullable|string|max:500',
            'notes'                  => 'nullable|string|max:2000',
        ]);

        $patientId = $validated['patient_id'] ?? $prescription->patient_id;
        $doctorId  = $validated['doctor_id'] ?? $prescription->doctor_id;

        // Verify patient if changing
        if (isset($validated['patient_id'])) {
            $patient = Patient::where('id', $patientId)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$patient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Patient not found or does not belong to your clinic.',
                ], 422);
            }
        }

        // Verify doctor if changing
        if (isset($validated['doctor_id'])) {
            $doctor = User::where('id', $doctorId)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$doctor || !$doctor->hasRole('doctor')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Doctor not found or does not belong to your clinic.',
                ], 422);
            }
        }

        // Validate appointment if provided
        if (array_key_exists('appointment_id', $validated) && !empty($validated['appointment_id'])) {
            $appointment = Appointment::where('id', $validated['appointment_id'])
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment not found or does not belong to your clinic.',
                ], 422);
            }

            if ($appointment->patient_id != $patientId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment does not belong to the specified patient.',
                ], 422);
            }

            if ($appointment->doctor_id != $doctorId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment does not belong to the specified doctor.',
                ], 422);
            }
        }

        if (isset($validated['medicines'])) {
            $validated['medicines'] = array_map(function ($med) {
                return [
                    'name'         => trim($med['name']),
                    'dosage'       => isset($med['dosage']) ? trim($med['dosage']) : '',
                    'frequency'    => isset($med['frequency']) ? trim($med['frequency']) : '',
                    'duration'     => isset($med['duration']) ? trim($med['duration']) : '',
                    'instructions' => isset($med['instructions']) ? trim($med['instructions']) : '',
                ];
            }, $validated['medicines']);
        }

        $prescription->update($validated);

        $prescription->load([
            'patient:id,name,phone,gender,age',
            'doctor:id,name',
            'appointment:id,scheduled_at,status',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prescription updated successfully.',
            'data'    => $prescription,
        ]);
    }

    /**
     * DELETE /api/prescriptions/{id}
     * Delete a prescription record.
     */
    public function destroy(Prescription $prescription)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($prescription->tenant_id !== $tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $prescription->delete();

        return response()->json([
            'success' => true,
            'message' => 'Prescription deleted successfully.',
        ]);
    }

    /**
     * POST /api/prescriptions/{id}/share-whatsapp
     * Validate patient phone and generate formatted WhatsApp link.
     */
    public function shareWhatsApp(Prescription $prescription)
    {
        $tenantId = auth()->user()->tenant_id;
        if ($prescription->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $prescription->load(['patient:id,name,phone', 'doctor:id,name']);

        $phone = $prescription->patient->phone ?? null;
        if (!$phone) {
            return response()->json([
                'success' => false,
                'message' => 'Patient phone number is not available.',
                'code'    => 'MISSING_PHONE',
            ], 422);
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($cleanPhone) === 10) {
            $cleanPhone = '91' . $cleanPhone;
        }

        $docName = $prescription->doctor->name ?? 'Doctor';
        if (!str_starts_with($docName, 'Dr')) {
            $docName = 'Dr. ' . $docName;
        }

        $rxId = 'RX-' . str_pad($prescription->id, 6, '0', STR_PAD_LEFT);
        $patientName = $prescription->patient->name ?? 'Patient';

        $medListStr = "";
        if (is_array($prescription->medicines)) {
            foreach ($prescription->medicines as $index => $med) {
                $name = $med['name'] ?? '';
                $freq = $med['frequency'] ?? '';
                $dur  = $med['duration'] ?? '';
                $medListStr .= "\n" . ($index + 1) . ". {$name}" . ($freq ? " ({$freq})" : "") . ($dur ? " - {$dur}" : "");
            }
        }

        $notes = $prescription->notes ? "\nNotes: " . $prescription->notes : "";
        $message = "Hello {$patientName},\n\nYour prescription from Qurelio Health is ready.\n\nPrescription: #{$rxId}\nDoctor: {$docName}\nMedicines:{$medListStr}{$notes}\n\nThank you for visiting Qurelio Health!";

        $whatsappUrl = "https://api.whatsapp.com/send?phone={$cleanPhone}&text=" . urlencode($message);

        return response()->json([
            'success'      => true,
            'message'      => 'WhatsApp share link created successfully.',
            'data'         => [
                'phone'        => $cleanPhone,
                'whatsapp_url' => $whatsappUrl,
                'message'      => $message,
            ]
        ]);
    }
}
