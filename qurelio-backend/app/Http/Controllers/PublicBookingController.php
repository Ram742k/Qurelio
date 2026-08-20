<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\DoctorSetting;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PublicBookingController extends Controller
{
    /**
     * GET /api/public/v1/{subdomain}/clinic
     * Fetch public clinic details for public widget display.
     */
    public function clinicInfo(string $subdomain)
    {
        $tenant = Tenant::where('subdomain', $subdomain)->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => [
                'name'          => $tenant->name,
                'subdomain'     => $tenant->subdomain,
                'phone'         => $tenant->phone,
                'email'         => $tenant->email,
                'address'       => $tenant->address,
                'city'          => $tenant->city,
                'logo_url'      => $tenant->logo_url,
                'working_hours' => $tenant->working_hours ?? Tenant::defaultWorkingHours(),
            ],
        ]);
    }

    /**
     * GET /api/public/v1/{subdomain}/doctors
     * List active doctors available for public self-booking.
     */
    public function doctors(string $subdomain)
    {
        $tenant = Tenant::where('subdomain', $subdomain)->firstOrFail();

        $doctors = User::where('tenant_id', $tenant->id)
            ->role('doctor')
            ->where('status', 'active')
            ->select('id', 'name', 'phone')
            ->get()
            ->map(function ($doctor) use ($tenant) {
                $setting = DoctorSetting::where('tenant_id', $tenant->id)
                    ->where('user_id', $doctor->id)
                    ->first();

                return [
                    'id'                   => $doctor->id,
                    'name'                 => $doctor->name,
                    'specialization'       => $setting->specialization ?? 'General Physician',
                    'consultation_fee'     => $setting->consultation_fee ?? 500.00,
                    'slot_duration_minutes' => $setting->slot_duration_minutes ?? 15,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $doctors,
        ]);
    }

    /**
     * GET /api/public/v1/{subdomain}/available-slots
     * Calculate available booking time slots for a doctor on a specific date.
     */
    public function availableSlots(Request $request, string $subdomain)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'date'      => 'required|date|after_or_equal:today',
        ]);

        $tenant = Tenant::where('subdomain', $subdomain)->firstOrFail();
        $date   = Carbon::parse($request->date);
        $dayName = strtolower($date->format('l'));

        $workingHours = $tenant->working_hours ?? Tenant::defaultWorkingHours();
        $dayConfig = $workingHours[$dayName] ?? ['open' => false];

        if (empty($dayConfig['open'])) {
            return response()->json([
                'success' => true,
                'data'    => [],
                'message' => 'Clinic is closed on ' . ucfirst($dayName) . 's.',
            ]);
        }

        $doctorSetting = DoctorSetting::where('tenant_id', $tenant->id)
            ->where('user_id', $request->doctor_id)
            ->first();

        $slotDuration = $doctorSetting->slot_duration_minutes ?? 15;

        $startTime = Carbon::parse($request->date . ' ' . ($dayConfig['start'] ?? '09:00'));
        $endTime   = Carbon::parse($request->date . ' ' . ($dayConfig['end'] ?? '18:00'));

        // Fetch existing booked appointments for doctor on date
        $bookedSlots = Appointment::where('tenant_id', $tenant->id)
            ->where('doctor_id', $request->doctor_id)
            ->whereDate('appointment_date', $date->toDateString())
            ->whereNotIn('status', ['cancelled'])
            ->pluck('appointment_time')
            ->map(fn($t) => Carbon::parse($t)->format('H:i'))
            ->toArray();

        $slots = [];
        $current = $startTime->copy();

        while ($current->lt($endTime)) {
            $formattedTime = $current->format('H:i');
            $isBooked = in_array($formattedTime, $bookedSlots);

            $slots[] = [
                'time'      => $formattedTime,
                'label'     => $current->format('h:i A'),
                'available' => !$isBooked,
            ];

            $current->addMinutes($slotDuration);
        }

        return response()->json([
            'success' => true,
            'data'    => $slots,
        ]);
    }

    /**
     * POST /api/public/v1/{subdomain}/book-appointment
     * Patient self-service booking (no login required).
     */
    public function bookAppointment(Request $request, string $subdomain)
    {
        $tenant = Tenant::where('subdomain', $subdomain)->firstOrFail();

        $validated = $request->validate([
            'doctor_id'        => 'required|exists:users,id',
            'patient_name'     => 'required|string|max:100',
            'patient_phone'    => 'required|string|max:20',
            'patient_gender'   => 'nullable|string|in:male,female,other',
            'patient_age'      => 'nullable|integer|min:0|max:120',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
            'reason'           => 'nullable|string|max:250',
        ]);

        // Collision check - prevent double booking
        $existing = Appointment::where('tenant_id', $tenant->id)
            ->where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('appointment_time', $validated['appointment_time'])
            ->whereNotIn('status', ['cancelled'])
            ->exists();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'The selected slot is no longer available. Please select another time.',
            ], 422);
        }

        // Find or create patient record under tenant
        $patient = Patient::firstOrCreate(
            ['tenant_id' => $tenant->id, 'phone' => $validated['patient_phone']],
            [
                'name'   => $validated['patient_name'],
                'gender' => $validated['patient_gender'] ?? 'other',
                'age'    => $validated['patient_age'] ?? null,
            ]
        );

        $appointment = Appointment::create([
            'tenant_id'        => $tenant->id,
            'patient_id'       => $patient->id,
            'doctor_id'        => $validated['doctor_id'],
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'status'           => 'booked',
            'type'             => 'online',
            'reason'           => $validated['reason'] ?? 'Public Self-Booking',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your appointment has been successfully booked!',
            'data'    => [
                'appointment_id'   => $appointment->id,
                'patient_name'     => $patient->name,
                'appointment_date' => $appointment->appointment_date,
                'appointment_time' => $appointment->appointment_time,
                'status'           => $appointment->status,
            ],
        ], 201);
    }
}
