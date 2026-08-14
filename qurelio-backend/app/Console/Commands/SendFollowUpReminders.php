<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendFollowUpReminders extends Command
{
    protected $signature = 'app:send-followup-reminders';
    protected $description = 'Send follow-up reminders to patients whose last visit was N days ago';

    public function handle()
    {
        $followUpDays = 5; // configurable per tenant later

        $appointments = Appointment::where('status', 'completed')
            ->whereDate('scheduled_at', now()->subDays($followUpDays)->toDateString())
            ->with('patient')
            ->get();

        foreach ($appointments as $appt) {
            // TODO: plug in actual SMS/WhatsApp API call here
            Log::info("Follow-up reminder sent to {$appt->patient->name} ({$appt->patient->phone})");
        }

        $this->info("Sent {$appointments->count()} follow-up reminders.");
    }
}
