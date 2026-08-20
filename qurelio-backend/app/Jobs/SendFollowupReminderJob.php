<?php

namespace App\Jobs;

use App\Models\Visit;
use App\Models\NotificationLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendFollowupReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    protected int $visitId;

    public function __construct(int $visitId)
    {
        $this->visitId = $visitId;
    }

    public function handle(): void
    {
        $visit = Visit::with(['patient', 'tenant', 'doctor'])->find($this->visitId);
        if (!$visit || !$visit->patient || !$visit->patient->phone) {
            return;
        }

        $patient = $visit->patient;
        $tenant  = $visit->tenant;
        $doctor  = $visit->doctor;

        $message = "Dear {$patient->name}, this is a friendly reminder for your scheduled follow-up consultation with Dr. {$doctor->name} at {$tenant->name}. Please call us to confirm your slot.";

        Log::info("Sending follow-up reminder to {$patient->phone}: {$message}");

        // Create delivery log record (Module 12)
        NotificationLog::create([
            'tenant_id'    => $visit->tenant_id,
            'recipient'    => $patient->phone,
            'channel'      => 'whatsapp',
            'type'         => 'followup_reminder',
            'content'      => $message,
            'status'       => 'sent',
            'sent_at'      => now(),
        ]);
    }
}
