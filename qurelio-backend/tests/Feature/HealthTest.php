<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_endpoint_returns_successful_status()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'healthy')
            ->assertJsonPath('application', 'Laravel')
            ->assertJsonStructure([
                'status',
                'application',
                'environment',
                'version',
                'timestamp',
                'checks' => [
                    'database',
                    'redis',
                    'queue',
                    'storage',
                ]
            ]);
    }
}
