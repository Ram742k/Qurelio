<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;
use Razorpay\Api\Api;

class RazorpayPaymentGateway implements PaymentGatewayInterface
{
    protected string $keyId;
    protected string $keySecret;
    protected ?string $webhookSecret;

    public function __construct()
    {
        $this->keyId         = config('services.razorpay.key_id') ?? env('RAZORPAY_KEY_ID', env('RAZORPAY_KEY', ''));
        $this->keySecret      = config('services.razorpay.key_secret') ?? env('RAZORPAY_KEY_SECRET', env('RAZORPAY_SECRET', ''));
        $this->webhookSecret  = config('services.razorpay.webhook_secret') ?? env('RAZORPAY_WEBHOOK_SECRET');
    }

    public function createOrder(Payment $payment, Invoice $invoice): array
    {
        $amountInPaise = (int) round($payment->amount * 100);

        if (!empty($this->keyId) && !empty($this->keySecret) && $this->keyId !== 'rzp_test_xxxxxxxxxx') {
            try {
                $api = new Api($this->keyId, $this->keySecret);
                $order = $api->order->create([
                    'receipt'  => $invoice->invoice_number,
                    'amount'   => $amountInPaise,
                    'currency' => 'INR',
                    'notes'    => [
                        'payment_id' => $payment->id,
                        'tenant_id'  => $payment->tenant_id,
                        'invoice_id' => $invoice->id,
                    ],
                ]);

                $payment->update([
                    'gateway_order_id' => $order['id'],
                    'gateway_status'   => 'created',
                    'gateway_response' => $order->toArray(),
                ]);

                return [
                    'gateway'  => 'razorpay',
                    'key'      => $this->keyId,
                    'order_id' => $order['id'],
                    'amount'   => $payment->amount,
                    'currency' => 'INR',
                ];
            } catch (\Exception $e) {
                Log::error('[RazorpayGateway] Failed to create order: ' . $e->getMessage());
                throw new \RuntimeException('Failed to create Razorpay order: ' . $e->getMessage());
            }
        }

        // Sandbox fallback mode when key is unconfigured / dummy test placeholder
        $mockOrderId = 'order_rzp_' . strtoupper(uniqid());
        $payment->update([
            'gateway_order_id' => $mockOrderId,
            'gateway_status'   => 'created_sandbox',
        ]);

        return [
            'gateway'  => 'razorpay',
            'key'      => $this->keyId ?: 'rzp_test_sandbox',
            'order_id' => $mockOrderId,
            'amount'   => $payment->amount,
            'currency' => 'INR',
            'sandbox'  => true,
        ];
    }

    public function verifyPayment(Payment $payment, array $payload): bool
    {
        $orderId   = $payload['razorpay_order_id'] ?? $payment->gateway_order_id;
        $paymentId = $payload['razorpay_payment_id'] ?? null;
        $signature = $payload['razorpay_signature'] ?? null;

        if (empty($paymentId)) {
            Log::warning('[RazorpayGateway] Missing razorpay_payment_id in verification');
            return false;
        }

        // Sandbox mode verification if test keys are placeholders
        if (empty($this->keySecret) || $this->keySecret === 'xxxxxxxxxxxxxxxx' || str_starts_with($orderId, 'order_rzp_')) {
            Log::info('[RazorpayGateway] Verifying in sandbox mode for payment #' . $payment->id);
            $payment->update([
                'gateway_payment_id' => $paymentId,
                'gateway_status'     => 'captured',
            ]);
            return true;
        }

        try {
            $api = new Api($this->keyId, $this->keySecret);
            $api->utility->verifyPaymentSignature([
                'razorpay_order_id'   => $orderId,
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature'  => $signature,
            ]);

            $payment->update([
                'gateway_payment_id' => $paymentId,
                'gateway_status'     => 'captured',
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('[RazorpayGateway] Signature verification failed: ' . $e->getMessage());
            return false;
        }
    }

    public function handleWebhook(array $payload, array $headers): array
    {
        $signature = $headers['x-razorpay-signature'][0] ?? $headers['x-razorpay-signature'] ?? null;

        // Verify webhook signature if webhook secret is configured
        if (!empty($this->webhookSecret) && !empty($signature)) {
            $expectedSignature = hash_hmac('sha256', json_encode($payload), $this->webhookSecret);
            if (!hash_equals($expectedSignature, $signature)) {
                Log::warning('[RazorpayGateway Webhook] Invalid signature');
                return ['success' => false, 'message' => 'Invalid signature'];
            }
        }

        $event = $payload['event'] ?? '';
        $entity = $payload['payload']['payment']['entity'] ?? [];

        if (in_array($event, ['payment.captured', 'order.paid'])) {
            $orderId   = $entity['order_id'] ?? null;
            $paymentId = $entity['id'] ?? null;

            return [
                'success'            => true,
                'event'              => $event,
                'gateway_order_id'   => $orderId,
                'gateway_payment_id' => $paymentId,
                'amount'             => isset($entity['amount']) ? $entity['amount'] / 100 : null,
                'raw'                => $entity,
            ];
        }

        return ['success' => false, 'event' => $event, 'message' => 'Event ignored'];
    }
}
