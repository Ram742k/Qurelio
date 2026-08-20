<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\NotificationLog;
use Carbon\Carbon;

class CheckTrialExpiry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trial:check-expiry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check tenant trial expiry status and trigger Day 7, Day 11, and Day 14 nudges';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenants = Tenant::whereNotNull('trial_ends_at')->get();
        $today = Carbon::now();
        $this->info("Checking trial expiry status for {$tenants->count()} clinics...");

        foreach ($tenants as $tenant) {
            $trialEnd = Carbon::parse($tenant->trial_ends_at);
            $daysLeft = (int) ceil($today->diffInDays($trialEnd, false));
            $nudges = $tenant->upgrade_nudges_sent ?? [];

            if ($daysLeft <= 7 && $daysLeft > 3 && !in_array('day_7', $nudges)) {
                $this->sendNudge($tenant, 'day_7', "Day 7 Check-in: You have added clinic records in Qurelio! Upgrade now to keep unlimited access.");
                $nudges[] = 'day_7';
            } elseif ($daysLeft <= 3 && $daysLeft > 0 && !in_array('day_11', $nudges)) {
                $this->sendNudge($tenant, 'day_11', "Urgency Alert: Only {$daysLeft} days left in your Qurelio trial! Upgrade now to secure your patient data.");
                $nudges[] = 'day_11';
            } elseif ($daysLeft <= 0 && !in_array('day_14', $nudges)) {
                $this->sendNudge($tenant, 'day_14', "Trial Ended: Your 14-day Qurelio trial has ended. Select a plan to continue accessing all clinic tools.");
                $nudges[] = 'day_14';
            }

            $tenant->upgrade_nudges_sent = array_unique($nudges);
            $tenant->save();
        }

        $this->info("Trial check completed successfully!");
        return Command::SUCCESS;
    }

    private function sendNudge($tenant, $nudgeType, $message)
    {
        $this->line("Triggering {$nudgeType} nudge for tenant #{$tenant->id} ({$tenant->name})");
        try {
            NotificationLog::create([
                'tenant_id' => $tenant->id,
                'channel'   => 'system_nudge',
                'recipient' => $tenant->email ?? 'clinic-admin',
                'type'      => 'trial_nudge',
                'content'   => $message,
                'status'    => 'delivered',
                'sent_at'   => now(),
            ]);
        } catch (\Exception $e) {
            $this->error("Failed to log notification: " . $e->getMessage());
        }
    }
}
