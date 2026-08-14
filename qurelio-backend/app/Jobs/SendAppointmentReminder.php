<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendAppointmentReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying.
     */
    public int $backoff = 60;

    public function __construct(
        public readonly int $appointmentId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        // Load the appointment with all related data
        $appointment = Appointment::with(['patient', 'doctor', 'tenant'])->find($this->appointmentId);

        if (!$appointment) {
            Log::warning("[SendAppointmentReminder] Appointment #{$this->appointmentId} not found. Skipping.");
            return;
        }

        // Only send reminders for booked appointments
        if (!in_array($appointment->status, ['booked', 'checked_in'])) {
            Log::info("[SendAppointmentReminder] Appointment #{$this->appointmentId} has status '{$appointment->status}'. Skipping reminder.");
            return;
        }

        // Verify patient has a phone number
        if (empty($appointment->patient?->phone)) {
            Log::warning("[SendAppointmentReminder] Appointment #{$this->appointmentId}: Patient has no phone number. Skipping.");
            return;
        }

        $patientName  = $appointment->patient->name ?? 'Patient';
        $doctorName   = $appointment->doctor->name ?? 'Doctor';
        $clinicName   = $appointment->tenant->name ?? 'Clinic';
        $appointmentDate = $appointment->scheduled_at->format('d M Y');
        $appointmentTime = $appointment->scheduled_at->format('h:i A');

        $message = "Hello {$patientName}, your appointment with Dr. {$doctorName} "
                 . "at {$clinicName} is scheduled for {$appointmentDate} at {$appointmentTime}. "
                 . "Please arrive 10 minutes early.";

        // Send through notification service abstraction
        $notificationService->send(
            phone:   $appointment->patient->phone,
            message: $message,
            context: [
                'appointment_id' => $appointment->id,
                'tenant_id'      => $appointment->tenant_id,
            ]
        );
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("[SendAppointmentReminder] Failed to send reminder for appointment #{$this->appointmentId}.", [
            'error' => $exception->getMessage(),
        ]);
    }
}
