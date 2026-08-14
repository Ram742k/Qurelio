<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant1;
    protected Tenant $tenant2;
    protected User $user1;
    protected User $user2;
    protected Patient $patient1;
    protected Patient $patient2;
    protected Invoice $invoice1;
    protected Invoice $invoice2;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed Spatie roles if needed, or simply assign mock tenants
        $this->tenant1 = Tenant::create([
            'name' => 'Test Clinic 1',
            'subdomain' => 'clinic1',
            'practice_type' => 'clinic',
            'subscription_status' => 'trial',
        ]);

        $this->tenant2 = Tenant::create([
            'name' => 'Test Clinic 2',
            'subdomain' => 'clinic2',
            'practice_type' => 'clinic',
            'subscription_status' => 'trial',
        ]);

        $this->user1 = User::create([
            'tenant_id' => $this->tenant1->id,
            'name' => 'Admin 1',
            'email' => 'admin1@clinic1.test',
            'phone' => '9840000000',
            'password' => bcrypt('password'),
        ]);

        $this->user2 = User::create([
            'tenant_id' => $this->tenant2->id,
            'name' => 'Admin 2',
            'email' => 'admin2@clinic2.test',
            'phone' => '9840000002',
            'password' => bcrypt('password'),
        ]);

        $this->patient1 = Patient::create([
            'tenant_id' => $this->tenant1->id,
            'name' => 'Patient 1',
            'phone' => '9000000001',
        ]);

        $this->patient2 = Patient::create([
            'tenant_id' => $this->tenant2->id,
            'name' => 'Patient 2',
            'phone' => '9000000002',
        ]);

        $this->invoice1 = Invoice::create([
            'tenant_id' => $this->tenant1->id,
            'patient_id' => $this->patient1->id,
            'invoice_number' => 'INV-TEST-001',
            'amount' => 1500.00,
            'status' => 'pending',
        ]);

        $this->invoice2 = Invoice::create([
            'tenant_id' => $this->tenant2->id,
            'patient_id' => $this->patient2->id,
            'invoice_number' => 'INV-TEST-002',
            'amount' => 2000.00,
            'status' => 'pending',
        ]);
    }

    public function test_can_create_razorpay_payment_order()
    {
        $response = $this->actingAs($this->user1)
            ->postJson("/api/invoices/{$this->invoice1->id}/online-payment", [
                'gateway' => 'razorpay',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'payment_id',
                'data' => [
                    'gateway',
                    'order_id',
                    'amount',
                    'currency',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'invoice_id' => $this->invoice1->id,
            'gateway' => 'razorpay',
            'status' => 'created',
            'amount' => 1500.00,
        ]);
    }

    public function test_can_create_phonepe_payment_order()
    {
        $response = $this->actingAs($this->user1)
            ->postJson("/api/invoices/{$this->invoice1->id}/online-payment", [
                'gateway' => 'phonepe',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'payment_id',
                'data' => [
                    'gateway',
                    'redirect_url',
                    'transaction_id',
                    'amount',
                ],
            ]);
    }

    public function test_cross_tenant_online_payment_access_rejected()
    {
        // User 2 trying to pay User 1's invoice
        $response = $this->actingAs($this->user2)
            ->postJson("/api/invoices/{$this->invoice1->id}/online-payment", [
                'gateway' => 'razorpay',
            ]);

        // Expect 404 because global tenant scope completely hides foreign tenant records
        $response->assertStatus(404);
    }

    public function test_cannot_pay_already_paid_invoice()
    {
        $this->invoice1->update(['status' => 'paid']);

        // Record a mock payment to balance
        Payment::create([
            'tenant_id' => $this->tenant1->id,
            'invoice_id' => $this->invoice1->id,
            'amount' => 1500.00,
            'gateway' => 'cash',
            'status' => 'success',
        ]);

        $response = $this->actingAs($this->user1)
            ->postJson("/api/invoices/{$this->invoice1->id}/online-payment", [
                'gateway' => 'razorpay',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_razorpay_payment_verification_and_cache_invalidation()
    {
        $payment = Payment::create([
            'tenant_id' => $this->tenant1->id,
            'invoice_id' => $this->invoice1->id,
            'amount' => 1500.00,
            'gateway' => 'razorpay',
            'gateway_order_id' => 'order_rzp_test123',
            'status' => 'created',
        ]);

        // Put dummy data in cache to test invalidation
        $date = today()->toDateString();
        Cache::put("tenant:{$this->tenant1->id}:dashboard:stats:{$date}", ['dummy' => 'data']);

        $response = $this->actingAs($this->user1)
            ->postJson("/api/invoices/{$this->invoice1->id}/verify", [
                'payment_id' => $payment->id,
                'razorpay_order_id' => 'order_rzp_test123',
                'razorpay_payment_id' => 'pay_rzp_mock123',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify database updates
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'success',
            'gateway_payment_id' => 'pay_rzp_mock123',
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice1->id,
            'status' => 'paid',
        ]);

        // Verify cache invalidation
        $this->assertFalse(Cache::has("tenant:{$this->tenant1->id}:dashboard:stats:{$date}"));
    }

    public function test_partial_payment_updates_invoice_status_correctly()
    {
        // Payment of 500 on 1500 invoice
        $payment = Payment::create([
            'tenant_id' => $this->tenant1->id,
            'invoice_id' => $this->invoice1->id,
            'amount' => 500.00,
            'gateway' => 'razorpay',
            'gateway_order_id' => 'order_rzp_partial',
            'status' => 'created',
        ]);

        $response = $this->actingAs($this->user1)
            ->postJson("/api/invoices/{$this->invoice1->id}/verify", [
                'payment_id' => $payment->id,
                'razorpay_order_id' => 'order_rzp_partial',
                'razorpay_payment_id' => 'pay_rzp_partial_mock',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice1->id,
            'status' => 'partial',
        ]);
    }
}
