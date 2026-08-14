<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class FollowUpRemindersTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_followup_reminders_command_processes_eligible_appointments()
    {
        Log::spy();

        $tenant = Tenant::create([
            'name' => 'Healing Hands Clinic',
            'subdomain' => 'healing',
            'practice_type' => 'clinic',
            'subscription_status' => 'active',
        ]);

        $doctor = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Dr. Smith',
            'email' => 'smith@healing.test',
            'phone' => '9876543210',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        $patient1 = Patient::create([
            'tenant_id' => $tenant->id,
            'name' => 'John Doe',
            'phone' => '9998887771',
            'gender' => 'male',
            'age' => 30,
        ]);

        $patient2 = Patient::create([
            'tenant_id' => $tenant->id,
            'name' => 'Jane Smith',
            'phone' => '9998887772',
            'gender' => 'female',
            'age' => 28,
        ]);

        // Completed 5 days ago -> SHOULD be reminded
        Appointment::create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient1->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => now()->subDays(5)->startOfDay(),
            'status' => 'completed',
        ]);

        // Completed today -> SHOULD NOT be reminded
        Appointment::create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient2->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => now()->startOfDay(),
            'status' => 'completed',
        ]);

        // Pending/booked 5 days ago -> SHOULD NOT be reminded
        Appointment::create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient2->id,
            'doctor_id' => $doctor->id,
            'scheduled_at' => now()->subDays(5)->startOfDay(),
            'status' => 'booked',
        ]);

        $this->artisan('app:send-followup-reminders')
            ->expectsOutput('Sent 1 follow-up reminders.')
            ->assertExitCode(0);

        Log::shouldHaveReceived('info')
            ->once()
            ->with("Follow-up reminder sent to John Doe (9998887771)");
    }
}
