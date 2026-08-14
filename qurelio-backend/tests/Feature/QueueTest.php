<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\QueueToken;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QueueTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant1;
    protected Tenant $tenant2;
    protected User $admin1;
    protected User $admin2;
    protected User $doctorA;
    protected User $doctorB;
    protected Patient $patient1;
    protected Appointment $appt1;
    protected Appointment $appt2;
    protected Appointment $appt3;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles so Spatie can resolve 'doctor' role
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->tenant1 = Tenant::create(['name' => 'Clinic 1', 'subdomain' => 'c1', 'practice_type' => 'clinic', 'subscription_status' => 'trial']);
        $this->tenant2 = Tenant::create(['name' => 'Clinic 2', 'subdomain' => 'c2', 'practice_type' => 'clinic', 'subscription_status' => 'trial']);

        $this->admin1 = User::create(['tenant_id' => $this->tenant1->id, 'name' => 'Admin 1', 'email' => 'a1@c1.test', 'phone' => '9000000001', 'password' => bcrypt('password')]);
        $this->admin2 = User::create(['tenant_id' => $this->tenant2->id, 'name' => 'Admin 2', 'email' => 'a2@c2.test', 'phone' => '9000000002', 'password' => bcrypt('password')]);

        $this->doctorA = User::create(['tenant_id' => $this->tenant1->id, 'name' => 'Dr. Arun', 'email' => 'arun@c1.test', 'phone' => '9000000003', 'password' => bcrypt('password')]);
        $this->doctorA->assignRole('doctor');

        $this->doctorB = User::create(['tenant_id' => $this->tenant1->id, 'name' => 'Dr. Bob', 'email' => 'bob@c1.test', 'phone' => '9000000004', 'password' => bcrypt('password')]);
        $this->doctorB->assignRole('doctor');

        $this->patient1 = Patient::create(['tenant_id' => $this->tenant1->id, 'name' => 'Patient 1', 'phone' => '9111111111']);

        $this->appt1 = Appointment::create(['tenant_id' => $this->tenant1->id, 'patient_id' => $this->patient1->id, 'doctor_id' => $this->doctorA->id, 'scheduled_at' => now()]);
        $this->appt2 = Appointment::create(['tenant_id' => $this->tenant1->id, 'patient_id' => $this->patient1->id, 'doctor_id' => $this->doctorA->id, 'scheduled_at' => now()]);
        $this->appt3 = Appointment::create(['tenant_id' => $this->tenant1->id, 'patient_id' => $this->patient1->id, 'doctor_id' => $this->doctorB->id, 'scheduled_at' => now()]);
    }

    public function test_can_generate_token_with_correct_initial_and_reset_conventions()
    {
        // 1. Generate first token for Dr. Arun
        $res1 = $this->actingAs($this->admin1)->postJson('/api/queue/tokens', ['appointment_id' => $this->appt1->id]);
        $res1->assertStatus(201)
            ->assertJsonPath('data.token_number', 'A-001');

        // 2. Generate second token for Dr. Arun -> should increment to A-002
        $res2 = $this->actingAs($this->admin1)->postJson('/api/queue/tokens', ['appointment_id' => $this->appt2->id]);
        $res2->assertStatus(201)
            ->assertJsonPath('data.token_number', 'A-002');

        // 3. Generate token for Dr. Bob -> should get B-001 (doctor-wise numbering)
        $res3 = $this->actingAs($this->admin1)->postJson('/api/queue/tokens', ['appointment_id' => $this->appt3->id]);
        $res3->assertStatus(201)
            ->assertJsonPath('data.token_number', 'B-001');
    }

    public function test_duplicate_token_generation_prevented()
    {
        // Generate first time
        $this->actingAs($this->admin1)->postJson('/api/queue/tokens', ['appointment_id' => $this->appt1->id]);

        // Try second time -> should return the same token
        $response = $this->actingAs($this->admin1)->postJson('/api/queue/tokens', ['appointment_id' => $this->appt1->id]);
        $response->assertStatus(200)
            ->assertJsonPath('data.token_number', 'A-001');

        // Total token count remains 1
        $this->assertEquals(1, QueueToken::count());
    }

    public function test_can_transition_queue_status_with_rules()
    {
        $res = $this->actingAs($this->admin1)->postJson('/api/queue/tokens', ['appointment_id' => $this->appt1->id]);
        $token = QueueToken::find($res->json('data.id'));

        // waiting -> serving
        $serveRes = $this->actingAs($this->admin1)->postJson("/api/queue/{$token->id}/serve");
        $serveRes->assertStatus(200)
            ->assertJsonPath('data.status', 'serving');

        // serving -> done
        $completeRes = $this->actingAs($this->admin1)->postJson("/api/queue/{$token->id}/complete");
        $completeRes->assertStatus(200)
            ->assertJsonPath('data.status', 'done');
    }

    public function test_invalid_status_transition_prevented()
    {
        $res = $this->actingAs($this->admin1)->postJson('/api/queue/tokens', ['appointment_id' => $this->appt1->id]);
        $token = QueueToken::find($res->json('data.id'));

        // Cannot complete waiting token directly
        $completeRes = $this->actingAs($this->admin1)->postJson("/api/queue/{$token->id}/complete");
        $completeRes->assertStatus(422);

        // Transition to done first
        $this->actingAs($this->admin1)->postJson("/api/queue/{$token->id}/serve");
        $this->actingAs($this->admin1)->postJson("/api/queue/{$token->id}/complete");

        // Cannot transition from done back to serving
        $serveRes = $this->actingAs($this->admin1)->postJson("/api/queue/{$token->id}/serve");
        $serveRes->assertStatus(422);
    }

    public function test_only_one_serving_token_per_doctor_is_enforced()
    {
        $t1 = QueueToken::create(['tenant_id' => $this->tenant1->id, 'doctor_id' => $this->doctorA->id, 'appointment_id' => $this->appt1->id, 'token_number' => 'A-001', 'status' => 'waiting']);
        $t2 = QueueToken::create(['tenant_id' => $this->tenant1->id, 'doctor_id' => $this->doctorA->id, 'appointment_id' => $this->appt2->id, 'token_number' => 'A-002', 'status' => 'waiting']);

        // Serve token 1
        $this->actingAs($this->admin1)->postJson("/api/queue/{$t1->id}/serve");
        $this->assertEquals('serving', $t1->fresh()->status);

        // Serve token 2 -> token 1 should automatically complete ('done')
        $this->actingAs($this->admin1)->postJson("/api/queue/{$t2->id}/serve");
        
        $this->assertEquals('done', $t1->fresh()->status);
        $this->assertEquals('serving', $t2->fresh()->status);
    }

    public function test_cross_tenant_queue_access_prevented()
    {
        $token = QueueToken::create(['tenant_id' => $this->tenant1->id, 'doctor_id' => $this->doctorA->id, 'appointment_id' => $this->appt1->id, 'token_number' => 'A-001', 'status' => 'waiting']);

        // Tenant 2 user tries to serve Tenant 1's token -> should return 404/403
        $res = $this->actingAs($this->admin2)->postJson("/api/queue/{$token->id}/serve");
        $res->assertStatus(404); // ModelNotFound due to global tenant scoping
    }

    public function test_call_next_serves_earliest_waiting_patient()
    {
        $t1 = QueueToken::create(['tenant_id' => $this->tenant1->id, 'doctor_id' => $this->doctorA->id, 'appointment_id' => $this->appt1->id, 'token_number' => 'A-001', 'status' => 'waiting', 'created_at' => now()->subMinutes(10)]);
        $t2 = QueueToken::create(['tenant_id' => $this->tenant1->id, 'doctor_id' => $this->doctorA->id, 'appointment_id' => $this->appt2->id, 'token_number' => 'A-002', 'status' => 'waiting', 'created_at' => now()]);

        // Call Next
        $res = $this->actingAs($this->admin1)->postJson('/api/queue/next', ['doctor_id' => $this->doctorA->id]);
        $res->assertStatus(200)
            ->assertJsonPath('data.token_number', 'A-001');

        $this->assertEquals('serving', $t1->fresh()->status);
        $this->assertEquals('waiting', $t2->fresh()->status);
    }
}
