<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $admin;
    protected User $doctor;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->tenant = Tenant::create([
            'name' => 'Metro Health Clinic',
            'subdomain' => 'metro',
            'practice_type' => 'clinic',
            'subscription_status' => 'active',
        ]);

        $this->admin = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Admin Metro',
            'email' => 'admin@metro.test',
            'phone' => '9000000010',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $this->admin->assignRole('clinic_admin');

        $this->doctor = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Dr. Adams',
            'email' => 'adams@metro.test',
            'phone' => '9000000011',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $this->doctor->assignRole('doctor');

        $this->patient = Patient::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Robert Paulson',
            'phone' => '9888877776',
            'gender' => 'male',
            'age' => 45,
        ]);

        Appointment::create([
            'tenant_id' => $this->tenant->id,
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'scheduled_at' => now(),
            'status' => 'completed',
        ]);

        Invoice::create([
            'tenant_id' => $this->tenant->id,
            'patient_id' => $this->patient->id,
            'invoice_number' => 'INV-METRO-001',
            'amount' => 1500.00,
            'status' => 'paid',
            'payment_method' => 'upi',
        ]);

        Prescription::create([
            'tenant_id' => $this->tenant->id,
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'medicines' => [['name' => 'Amoxicillin', 'dosage' => '500mg']],
        ]);
    }

    public function test_can_fetch_report_dashboard()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reports/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_revenue', 1500)
            ->assertJsonPath('data.completed_visits', 1);
    }

    public function test_can_fetch_revenue_report()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reports/revenue');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_revenue', 1500)
            ->assertJsonPath('data.payment_methods_breakdown.upi', 1500);
    }

    public function test_can_fetch_doctor_performance_report()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reports/doctor-performance');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['name' => 'Dr. Adams', 'patients_seen' => 1]);
    }

    public function test_can_export_report_csv()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->get('/api/reports/export?format=csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('Metro Health Clinic', $response->streamedContent());
    }
}
