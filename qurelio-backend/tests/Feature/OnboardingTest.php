<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant1;
    protected Tenant $tenant2;
    protected User $admin1;
    protected User $admin2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->tenant1 = Tenant::create([
            'name'                 => 'Sunrise Clinic',
            'subdomain'            => 'sunrise',
            'practice_type'        => 'clinic',
            'subscription_status'  => 'trial',
            'onboarding_completed' => false,
        ]);

        $this->tenant2 = Tenant::create([
            'name'                 => 'Moonlight Clinic',
            'subdomain'            => 'moonlight',
            'practice_type'        => 'clinic',
            'subscription_status'  => 'trial',
            'onboarding_completed' => false,
        ]);

        $this->admin1 = User::create([
            'tenant_id' => $this->tenant1->id,
            'name'      => 'Admin Sunrise',
            'email'     => 'admin@sunrise.test',
            'phone'     => '9000000001',
            'password'  => bcrypt('password'),
            'status'    => 'active',
        ]);
        $this->admin1->assignRole('clinic_admin');

        $this->admin2 = User::create([
            'tenant_id' => $this->tenant2->id,
            'name'      => 'Admin Moonlight',
            'email'     => 'admin@moonlight.test',
            'phone'     => '9000000002',
            'password'  => bcrypt('password'),
            'status'    => 'active',
        ]);
        $this->admin2->assignRole('clinic_admin');
    }

    public function test_can_retrieve_onboarding_state_with_defaults()
    {
        $response = $this->actingAs($this->admin1)->getJson('/api/onboarding');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.onboarding_completed', false)
            ->assertJsonPath('data.clinic.name', 'Sunrise Clinic')
            ->assertJsonStructure(['data' => ['clinic', 'working_hours', 'onboarding_completed']]);
    }

    public function test_can_save_clinic_details()
    {
        $payload = [
            'name'     => 'Sunrise Health Clinic',
            'phone'    => '+91 98400 12345',
            'email'    => 'contact@sunrise.com',
            'address'  => '123 Main Street, Ground Floor',
            'city'     => 'Chennai',
            'state'    => 'Tamil Nadu',
            'country'  => 'India',
            'pincode'  => '600001',
            'timezone' => 'Asia/Kolkata',
        ];

        $response = $this->actingAs($this->admin1)->putJson('/api/onboarding/clinic', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Sunrise Health Clinic')
            ->assertJsonPath('data.city', 'Chennai')
            ->assertJsonPath('data.timezone', 'Asia/Kolkata');

        $this->assertDatabaseHas('tenants', [
            'id'    => $this->tenant1->id,
            'name'  => 'Sunrise Health Clinic',
            'city'  => 'Chennai',
            'email' => 'contact@sunrise.com',
        ]);
    }

    public function test_clinic_name_is_required()
    {
        $response = $this->actingAs($this->admin1)->putJson('/api/onboarding/clinic', [
            'name' => '',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_can_save_working_hours()
    {
        $payload = [
            'working_hours' => [
                'monday'    => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
                'tuesday'   => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
                'wednesday' => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
                'thursday'  => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
                'friday'    => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
                'saturday'  => ['open' => true,  'start' => '09:00', 'end' => '14:00'],
                'sunday'    => ['open' => false, 'start' => '09:00', 'end' => '18:00'],
            ],
        ];

        $response = $this->actingAs($this->admin1)->putJson('/api/onboarding/working-hours', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.working_hours.monday.open', true)
            ->assertJsonPath('data.working_hours.sunday.open', false);

        $this->tenant1->refresh();
        $this->assertTrue($this->tenant1->working_hours['monday']['open']);
        $this->assertFalse($this->tenant1->working_hours['sunday']['open']);
    }

    public function test_closing_time_before_opening_time_is_rejected()
    {
        $payload = [
            'working_hours' => [
                'monday' => ['open' => true, 'start' => '18:00', 'end' => '09:00'],
            ],
        ];

        $response = $this->actingAs($this->admin1)->putJson('/api/onboarding/working-hours', $payload);

        $response->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_can_complete_onboarding()
    {
        // Setup clinic details first
        $this->tenant1->update([
            'name'          => 'Sunrise Health Clinic',
            'phone'         => '9840000000',
            'timezone'      => 'Asia/Kolkata',
            'working_hours' => Tenant::defaultWorkingHours(),
        ]);

        $response = $this->actingAs($this->admin1)->postJson('/api/onboarding/complete');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.onboarding_completed', true);

        $this->tenant1->refresh();
        $this->assertTrue($this->tenant1->onboarding_completed);
    }

    public function test_onboarding_completion_persists_across_login()
    {
        // Mark onboarding complete
        $this->tenant1->update(['onboarding_completed' => true, 'name' => 'Test Clinic']);

        $loginResponse = $this->postJson('/api/login', [
            'phone'    => '9000000001',
            'password' => 'password',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonPath('tenant.onboarding_completed', true);
    }

    public function test_cross_tenant_cannot_modify_other_tenant_onboarding()
    {
        // Admin 2 should only update Tenant 2 data, not Tenant 1's
        $response = $this->actingAs($this->admin2)->putJson('/api/onboarding/clinic', [
            'name'     => 'Hacked Clinic Name',
            'timezone' => 'UTC',
        ]);

        // Admin 2's clinic gets updated (not Admin 1's)
        $response->assertStatus(200);

        // Tenant 1 should be untouched
        $this->tenant1->refresh();
        $this->assertEquals('Sunrise Clinic', $this->tenant1->name);
    }
}
