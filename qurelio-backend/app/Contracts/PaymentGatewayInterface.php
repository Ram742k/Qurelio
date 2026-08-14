<?php

namespace App\Contracts;

use App\Models\Invoice;
use App\Models\Payment;

interface PaymentGatewayInterface
{
    /**
     * Create an online payment order/request for the gateway.
     *
     * @param Payment $payment Initial payment transaction record
     * @param Invoice $invoice Invoice associated with the payment
     * @return array Gateway-specific response data needed by frontend
     */
    public function createOrder(Payment $payment, Invoice $invoice): array;

    /**
     * Server-side verification of payment signature/checksum.
     *
     * @param Payment $payment Payment record to verify
     * @param array   $payload Verification payload sent by frontend
     * @return bool True if signature/checksum is valid
     */
    public function verifyPayment(Payment $payment, array $payload): bool;

    /**
     * Handle asynchronous webhook notification from the gateway.
     *
     * @param array $payload Webhook request body
     * @param array $headers Request headers for signature verification
     * @return array Standardized result containing ['success' => bool, 'payment_id' => ?, 'status' => ?]
     */
    public function handleWebhook(array $payload, array $headers): array;
}
