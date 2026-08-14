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

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $userA;
    protected User $userB;
    protected Patient $patientA;
    protected Patient $patientB;
    protected Appointment $appointmentA;
    protected Appointment $appointmentB;
    protected Invoice $invoiceA;
    protected Invoice $invoiceB;
    protected Prescription $prescriptionA;
    protected Prescription $prescriptionB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        // Clinic A setup
        $this->tenantA = Tenant::create([
            'name' => 'Clinic Alpha',
            'subdomain' => 'alpha',
            'practice_type' => 'clinic',
            'subscription_status' => 'active',
        ]);
        $this->userA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Dr. Alpha',
            'email' => 'alpha@clinic.test',
            'phone' => '9000000001',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $this->userA->assignRole('doctor');

        // Clinic B setup
        $this->tenantB = Tenant::create([
            'name' => 'Clinic Beta',
            'subdomain' => 'beta',
            'practice_type' => 'clinic',
            'subscription_status' => 'active',
        ]);
        $this->userB = User::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Dr. Beta',
            'email' => 'beta@clinic.test',
            'phone' => '9000000002',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $this->userB->assignRole('doctor');

        // Data for Tenant A
        $this->patientA = Patient::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Patient Alpha',
            'phone' => '9111111111',
            'gender' => 'male',
            'age' => 40,
        ]);
        $this->appointmentA = Appointment::create([
            'tenant_id' => $this->tenantA->id,
            'patient_id' => $this->patientA->id,
            'doctor_id' => $this->userA->id,
            'scheduled_at' => now()->addDays(1),
            'status' => 'booked',
        ]);
        $this->invoiceA = Invoice::create([
            'tenant_id' => $this->tenantA->id,
            'patient_id' => $this->patientA->id,
            'invoice_number' => 'INV-A-1001',
            'amount' => 500.00,
            'status' => 'pending',
        ]);
        $this->prescriptionA = Prescription::create([
            'tenant_id' => $this->tenantA->id,
            'patient_id' => $this->patientA->id,
            'doctor_id' => $this->userA->id,
            'appointment_id' => $this->appointmentA->id,
            'medicines' => [['name' => 'Paracetamol', 'dosage' => '500mg', 'frequency' => '1-0-1', 'duration' => '3 days']],
        ]);

        // Data for Tenant B
        $this->patientB = Patient::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Patient Beta',
            'phone' => '9222222222',
            'gender' => 'female',
            'age' => 35,
        ]);
        $this->appointmentB = Appointment::create([
            'tenant_id' => $this->tenantB->id,
            'patient_id' => $this->patientB->id,
            'doctor_id' => $this->userB->id,
            'scheduled_at' => now()->addDays(2),
            'status' => 'booked',
        ]);
        $this->invoiceB = Invoice::create([
            'tenant_id' => $this->tenantB->id,
            'patient_id' => $this->patientB->id,
            'invoice_number' => 'INV-B-2001',
            'amount' => 1200.00,
            'status' => 'pending',
        ]);
        $this->prescriptionB = Prescription::create([
            'tenant_id' => $this->tenantB->id,
            'patient_id' => $this->patientB->id,
            'doctor_id' => $this->userB->id,
            'appointment_id' => $this->appointmentB->id,
            'medicines' => [['name' => 'Amoxicillin', 'dosage' => '250mg', 'frequency' => '1-1-1', 'duration' => '5 days']],
        ]);
    }

    public function test_tenant_a_cannot_see_tenant_b_patients_in_index()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/patients');

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Patient Alpha']);
        $response->assertJsonMissing(['name' => 'Patient Beta']);
    }

    public function test_tenant_a_cannot_view_tenant_b_patient_details()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/patients/' . $this->patientB->id);

        $response->assertStatus(404);
    }

    public function test_tenant_a_cannot_see_tenant_b_appointments_in_index()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/appointments');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $this->appointmentA->id]);
        $response->assertJsonMissing(['id' => $this->appointmentB->id]);
    }

    public function test_tenant_a_cannot_view_tenant_b_appointment_details()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/appointments/' . $this->appointmentB->id);

        $response->assertStatus(404);
    }

    public function test_tenant_a_cannot_see_tenant_b_invoices_in_index()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/invoices');

        $response->assertStatus(200);
        $response->assertJsonFragment(['invoice_number' => 'INV-A-1001']);
        $response->assertJsonMissing(['invoice_number' => 'INV-B-2001']);
    }

    public function test_tenant_a_cannot_view_tenant_b_invoice_details()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/invoices/' . $this->invoiceB->id);

        $response->assertStatus(404);
    }

    public function test_tenant_a_cannot_see_tenant_b_prescriptions_in_index()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/prescriptions');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $this->prescriptionA->id]);
        $response->assertJsonMissing(['id' => $this->prescriptionB->id]);
    }

    public function test_tenant_a_cannot_view_tenant_b_prescription_details()
    {
        $response = $this->actingAs($this->userA, 'sanctum')
            ->getJson('/api/prescriptions/' . $this->prescriptionB->id);

        $response->assertStatus(404);
    }
}
