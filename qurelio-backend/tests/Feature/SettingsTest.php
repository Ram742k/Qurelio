<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $admin;
    protected User $doctor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->tenant = Tenant::create([
            'name' => 'St. Jude Healthcare',
            'subdomain' => 'stjude',
            'practice_type' => 'clinic',
            'subscription_status' => 'active',
        ]);

        $this->admin = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Admin Jude',
            'email' => 'admin@stjude.test',
            'phone' => '9000000020',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $this->admin->assignRole('clinic_admin');

        $this->doctor = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Dr. Jude Doctor',
            'email' => 'doc@stjude.test',
            'phone' => '9000000021',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $this->doctor->assignRole('doctor');
    }

    public function test_can_fetch_and_update_general_settings()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings/general');

        $response->assertStatus(200)
            ->assertJsonPath('data.clinic_name', 'St. Jude Healthcare');

        $updateResponse = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/settings/general', [
                'clinic_name' => 'St. Jude Super Clinic',
                'timezone'    => 'Asia/Kolkata',
                'language'    => 'English',
                'currency'    => 'INR',
                'date_format' => 'DD/MM/YYYY',
            ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('tenants', ['name' => 'St. Jude Super Clinic']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'SETTINGS_GENERAL_UPDATED']);
    }

    public function test_can_fetch_and_update_working_hours()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings/working-hours');

        $response->assertStatus(200);

        $hours = Tenant::defaultWorkingHours();
        $hours['monday']['start'] = '08:30';

        $updateResponse = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/settings/working-hours', [
                'working_hours' => $hours,
            ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('audit_logs', ['action' => 'SETTINGS_HOURS_UPDATED']);
    }

    public function test_non_admin_cannot_access_clinic_settings()
    {
        $response = $this->actingAs($this->doctor, 'sanctum')
            ->getJson('/api/settings/general');

        $response->assertStatus(403);
    }

    public function test_can_fetch_audit_logs()
    {
        AuditLog::create([
            'tenant_id'   => $this->tenant->id,
            'user_id'     => $this->admin->id,
            'user_name'   => $this->admin->name,
            'action'      => 'TEST_ACTION',
            'description' => 'Test log description',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings/audit-logs');

        $response->assertStatus(200)
            ->assertJsonFragment(['action' => 'TEST_ACTION']);
    }
}
