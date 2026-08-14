<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrescriptionTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant1;
    protected Tenant $tenant2;
    protected User $admin1;
    protected User $admin2;
    protected User $doctor1;
    protected User $doctor2;
    protected User $receptionist;
    protected Patient $patient1;
    protected Patient $patient2;
    protected Appointment $appointment1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RoleSeeder::class);

        // Create 2 Tenants
        $this->tenant1 = Tenant::create(['name' => 'Clinic Alpha', 'subdomain' => 'alpha', 'practice_type' => 'clinic', 'subscription_status' => 'active']);
        $this->tenant2 = Tenant::create(['name' => 'Clinic Beta', 'subdomain' => 'beta', 'practice_type' => 'clinic', 'subscription_status' => 'active']);

        // Tenant 1 Users
        $this->admin1 = User::create(['tenant_id' => $this->tenant1->id, 'name' => 'Admin Alpha', 'email' => 'admin@alpha.test', 'phone' => '9000000001', 'password' => bcrypt('password')]);
        $this->doctor1 = User::create(['tenant_id' => $this->tenant1->id, 'name' => 'Dr. Alpha Doctor', 'email' => 'doctor@alpha.test', 'phone' => '9000000002', 'password' => bcrypt('password')]);
        $this->doctor1->assignRole('doctor');

        $this->receptionist = User::create(['tenant_id' => $this->tenant1->id, 'name' => 'Receptionist Alpha', 'email' => 'staff@alpha.test', 'phone' => '9000000003', 'password' => bcrypt('password')]);
        $this->receptionist->assignRole('front_desk');

        // Tenant 2 Users
        $this->admin2 = User::create(['tenant_id' => $this->tenant2->id, 'name' => 'Admin Beta', 'email' => 'admin@beta.test', 'phone' => '9000000004', 'password' => bcrypt('password')]);
        $this->doctor2 = User::create(['tenant_id' => $this->tenant2->id, 'name' => 'Dr. Beta Doctor', 'email' => 'doctor@beta.test', 'phone' => '9000000005', 'password' => bcrypt('password')]);
        $this->doctor2->assignRole('doctor');

        // Patients
        $this->patient1 = Patient::create(['tenant_id' => $this->tenant1->id, 'name' => 'Patient Alpha', 'phone' => '9111111111', 'age' => 30, 'gender' => 'male']);
        $this->patient2 = Patient::create(['tenant_id' => $this->tenant2->id, 'name' => 'Patient Beta', 'phone' => '9222222222', 'age' => 25, 'gender' => 'female']);

        // Appointment for Tenant 1
        $this->appointment1 = Appointment::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'scheduled_at' => now(),
            'status' => 'completed',
        ]);
    }

    public function test_can_create_prescription_with_valid_data()
    {
        $payload = [
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'appointment_id' => $this->appointment1->id,
            'medicines' => [
                [
                    'name' => 'Amoxicillin 500mg',
                    'dosage' => '500mg',
                    'frequency' => '1-0-1',
                    'duration' => '5 Days',
                    'instructions' => 'After food',
                ],
                [
                    'name' => 'Paracetamol 650mg',
                    'dosage' => '650mg',
                    'frequency' => '1-1-1',
                    'duration' => '3 Days',
                    'instructions' => 'When needed for fever',
                ]
            ],
            'notes' => 'Review after 5 days if symptoms persist.',
        ];

        $response = $this->actingAs($this->admin1)->postJson('/api/prescriptions', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.patient_id', $this->patient1->id)
            ->assertJsonPath('data.doctor_id', $this->doctor1->id)
            ->assertJsonPath('data.appointment_id', $this->appointment1->id)
            ->assertJsonPath('data.medicines.0.name', 'Amoxicillin 500mg')
            ->assertJsonPath('data.medicines.0.frequency', '1-0-1')
            ->assertJsonPath('data.notes', 'Review after 5 days if symptoms persist.');

        $this->assertDatabaseHas('prescriptions', [
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
        ]);
    }

    public function test_empty_medicines_list_is_rejected()
    {
        $payload = [
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [],
        ];

        $response = $this->actingAs($this->admin1)->postJson('/api/prescriptions', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['medicines']);
    }

    public function test_medicine_without_name_is_rejected()
    {
        $payload = [
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [
                [
                    'dosage' => '500mg',
                    'frequency' => '1-0-1',
                ]
            ],
        ];

        $response = $this->actingAs($this->admin1)->postJson('/api/prescriptions', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['medicines.0.name']);
    }

    public function test_cross_tenant_patient_is_rejected()
    {
        $payload = [
            'patient_id' => $this->patient2->id, // Patient belonging to Tenant 2
            'doctor_id' => $this->doctor1->id,
            'medicines' => [
                ['name' => 'Aspirin 100mg']
            ],
        ];

        $response = $this->actingAs($this->admin1)->postJson('/api/prescriptions', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Patient not found or does not belong to your clinic.');
    }

    public function test_cross_tenant_doctor_is_rejected()
    {
        $payload = [
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor2->id, // Doctor belonging to Tenant 2
            'medicines' => [
                ['name' => 'Aspirin 100mg']
            ],
        ];

        $response = $this->actingAs($this->admin1)->postJson('/api/prescriptions', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Doctor not found or does not belong to your clinic.');
    }

    public function test_non_doctor_user_is_rejected_as_doctor_id()
    {
        $payload = [
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->receptionist->id, // User without 'doctor' role
            'medicines' => [
                ['name' => 'Aspirin 100mg']
            ],
        ];

        $response = $this->actingAs($this->admin1)->postJson('/api/prescriptions', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'The selected user is not a registered doctor.');
    }

    public function test_can_view_single_prescription()
    {
        $prescription = Prescription::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [
                ['name' => 'Metformin 500mg', 'dosage' => '500mg', 'frequency' => '1-0-1', 'duration' => '30 Days', 'instructions' => 'With meals']
            ],
            'notes' => 'Check HbA1c in 3 months.',
        ]);

        $response = $this->actingAs($this->admin1)->getJson("/api/prescriptions/{$prescription->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $prescription->id)
            ->assertJsonPath('data.patient.name', $this->patient1->name)
            ->assertJsonPath('data.doctor.name', $this->doctor1->name)
            ->assertJsonPath('data.medicines.0.name', 'Metformin 500mg');
    }

    public function test_cross_tenant_view_is_unauthorized()
    {
        $prescription = Prescription::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [['name' => 'Paracetamol 500mg']],
        ]);

        // Attempting to access Tenant 1 prescription from Tenant 2 user
        $response = $this->actingAs($this->admin2)->getJson("/api/prescriptions/{$prescription->id}");

        $response->assertStatus(404);
    }

    public function test_can_list_and_filter_prescriptions()
    {
        Prescription::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [['name' => 'Cetirizine 10mg']],
            'created_at' => now(),
        ]);

        // List prescriptions
        $response = $this->actingAs($this->admin1)->getJson('/api/prescriptions');
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.data');

        // Filter by patient_id
        $responseWithPatient = $this->actingAs($this->admin1)->getJson("/api/prescriptions?patient_id={$this->patient1->id}");
        $responseWithPatient->assertStatus(200)
            ->assertJsonCount(1, 'data.data');

        // Filter by doctor_id
        $responseWithDoctor = $this->actingAs($this->admin1)->getJson("/api/prescriptions?doctor_id={$this->doctor1->id}");
        $responseWithDoctor->assertStatus(200)
            ->assertJsonCount(1, 'data.data');

        // Filter by non-matching date
        $responseWithDate = $this->actingAs($this->admin1)->getJson("/api/prescriptions?date=2020-01-01");
        $responseWithDate->assertStatus(200)
            ->assertJsonCount(0, 'data.data');
    }

    public function test_can_update_prescription()
    {
        $prescription = Prescription::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [['name' => 'Ibuprofen 400mg']],
            'notes' => 'Original notes',
        ]);

        $updatePayload = [
            'medicines' => [
                ['name' => 'Ibuprofen 400mg', 'dosage' => '400mg', 'frequency' => '0-0-1', 'duration' => '2 Days', 'instructions' => 'After food'],
                ['name' => 'Pantoprazole 40mg', 'dosage' => '40mg', 'frequency' => '1-0-0', 'duration' => '5 Days', 'instructions' => 'Before food']
            ],
            'notes' => 'Updated notes',
        ];

        $response = $this->actingAs($this->admin1)->putJson("/api/prescriptions/{$prescription->id}", $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.notes', 'Updated notes')
            ->assertJsonCount(2, 'data.medicines');
    }

    public function test_can_delete_prescription()
    {
        $prescription = Prescription::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [['name' => 'Azithromycin 500mg']],
        ]);

        $response = $this->actingAs($this->admin1)->deleteJson("/api/prescriptions/{$prescription->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Prescription deleted successfully.');

        $this->assertDatabaseMissing('prescriptions', ['id' => $prescription->id]);
    }

    public function test_can_generate_whatsapp_share_link()
    {
        $prescription = Prescription::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'doctor_id' => $this->doctor1->id,
            'medicines' => [['name' => 'Paracetamol 650mg', 'dosage' => '650mg', 'frequency' => '1-1-1', 'duration' => '3 Days']],
            'notes' => 'Drink warm water',
        ]);

        $response = $this->actingAs($this->admin1)->postJson("/api/prescriptions/{$prescription->id}/share-whatsapp");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.phone', '919111111111')
            ->assertJsonStructure(['data' => ['phone', 'whatsapp_url', 'message']]);
    }
}
