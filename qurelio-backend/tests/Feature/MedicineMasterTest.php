<?php

namespace Tests\Feature;

use App\Models\MedicineMaster;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MedicineMasterTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $doctorUser;
    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name'                 => 'Apollo Clinic',
            'subdomain'            => 'apollo-test',
            'practice_type'        => 'clinic',
            'onboarding_completed' => true,
        ]);

        $this->adminUser = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Admin User',
            'phone'     => '9998887770',
            'email'     => 'admin@apollo.test',
            'password'  => bcrypt('password'),
            'status'    => 'active',
        ]);

        $this->doctorUser = User::create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Dr. Mehta',
            'phone'     => '9998887771',
            'email'     => 'mehta@apollo.test',
            'password'  => bcrypt('password'),
            'status'    => 'active',
        ]);

        MedicineMaster::create([
            'brand_name'   => 'Dolo',
            'generic_name' => 'Paracetamol',
            'strength'     => '650 mg',
            'form'         => 'Tablet',
            'is_custom'    => false,
            'is_active'    => true,
        ]);
    }

    public function test_can_search_medicines_with_autocomplete()
    {
        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->getJson('/api/medicines/search?q=dolo');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonFragment([
                'brand_name' => 'Dolo',
                'strength'   => '650 mg',
            ]);
    }

    public function test_search_requires_minimum_two_characters()
    {
        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->getJson('/api/medicines/search?q=d');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [],
            ]);
    }

    public function test_doctor_can_create_custom_medicine()
    {
        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->postJson('/api/medicines/custom', [
                'brand_name'   => 'MyCustomMed',
                'generic_name' => 'Custom Compound',
                'strength'     => '100 mg',
                'form'         => 'Capsule',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonFragment([
                'brand_name' => 'MyCustomMed',
                'is_custom'  => true,
            ]);

        $this->assertDatabaseHas('medicine_master', [
            'tenant_id'  => $this->tenant->id,
            'brand_name' => 'MyCustomMed',
            'is_custom'  => true,
        ]);
    }
}
