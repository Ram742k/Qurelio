<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use App\Services\DashboardService;
use App\Services\Gateways\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * POST /api/invoices/{invoice}/online-payment
     * Request body: { "gateway": "razorpay" | "phonepe" }
     */
    public function startOnlinePayment(Request $request, Invoice $invoice)
    {
        $tenantId = auth()->user()->tenant_id;

        // Tenant isolation: verify invoice belongs to user's tenant
        if ($invoice->tenant_id !== $tenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found or does not belong to your clinic.',
            ], 403);
        }

        // Calculate remaining balance from existing successful payments
        $paidSoFar = Payment::where('invoice_id', $invoice->id)
            ->where('status', 'success')
            ->sum('amount');

        $outstandingBalance = max(0, $invoice->amount - $paidSoFar);

        // Reject if invoice is already fully paid
        if ($invoice->status === 'paid' || $outstandingBalance <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'This invoice has already been fully paid.',
            ], 422);
        }

        $validated = $request->validate([
            'gateway' => 'required|string|in:razorpay,phonepe',
        ]);

        $gatewayName = strtolower($validated['gateway']);

        try {
            // Create local payment transaction in DB
            $payment = Payment::create([
                'tenant_id'  => $tenantId,
                'invoice_id' => $invoice->id,
                'amount'     => $outstandingBalance,
                'gateway'    => $gatewayName,
                'status'     => 'created',
            ]);

            // Call gateway abstraction to create order/payment request
            $gatewayInstance = PaymentGatewayFactory::make($gatewayName);
            $orderData       = $gatewayInstance->createOrder($payment, $invoice);

            return response()->json([
                'success'    => true,
                'payment_id' => $payment->id,
                'data'       => $orderData,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('[PaymentController] Online payment creation failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to initialize payment gateway.'], 500);
        }
    }

    /**
     * POST /api/invoices/{invoice}/verify
     */
    public function verifyPayment(Request $request, Invoice $invoice)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($invoice->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access to invoice.'], 403);
        }

        // Find the latest payment transaction for this invoice
        $paymentId = $request->input('payment_id');
        $query = Payment::where('invoice_id', $invoice->id)->where('tenant_id', $tenantId);

        if ($paymentId) {
            $query->where('id', $paymentId);
        }

        $payment = $query->latest()->first();

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment transaction record not found.'], 404);
        }

        // If already verified success, return current status idempotently
        if ($payment->status === 'success') {
            return response()->json([
                'success' => true,
                'message' => 'Payment already verified.',
                'data'    => $payment->load('invoice'),
            ]);
        }

        $gatewayInstance = PaymentGatewayFactory::make($payment->gateway);
        $isValid         = $gatewayInstance->verifyPayment($payment, $request->all());

        if (!$isValid) {
            $payment->update(['status' => 'failed']);
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed or invalid signature.',
            ], 400);
        }

        // DB Transaction for atomic verification & status update
        DB::transaction(function () use ($payment, $invoice, $tenantId, $request) {
            $payment->update([
                'status'              => 'success',
                'paid_at'             => now(),
                'gateway_payment_id'  => $request->input('razorpay_payment_id', $payment->gateway_payment_id),
            ]);

            // Recalculate invoice status
            $this->recalculateInvoiceStatus($invoice);

            // Invalidate tenant dashboard cache
            app(DashboardService::class)->invalidate($tenantId);
        });

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully.',
            'data'    => $payment->fresh()->load('invoice'),
        ]);
    }

    /**
     * GET /api/payments/{payment}/status
     */
    public function getPaymentStatus(Payment $payment)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($payment->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $payment->id,
                'status'         => $payment->status,
                'gateway'        => $payment->gateway,
                'amount'         => $payment->amount,
                'transaction_id' => $payment->gateway_payment_id ?: $payment->gateway_order_id,
                'paid_at'        => $payment->paid_at ? $payment->paid_at->toIso8601String() : null,
                'invoice'        => [
                    'id'             => $payment->invoice_id,
                    'invoice_number' => $payment->invoice->invoice_number ?? null,
                    'status'         => $payment->invoice->status ?? null,
                ],
            ],
        ]);
    }

    /**
     * POST /api/payments/webhooks/razorpay
     */
    public function razorpayWebhook(Request $request)
    {
        $gateway = PaymentGatewayFactory::make('razorpay');
        $res     = $gateway->handleWebhook($request->all(), $request->headers->all());

        if (!$res['success']) {
            return response()->json(['status' => 'ignored'], 200);
        }

        $orderId   = $res['gateway_order_id'];
        $paymentId = $res['gateway_payment_id'];

        if (!$orderId) {
            return response()->json(['status' => 'no_order_id'], 200);
        }

        $payment = Payment::where('gateway_order_id', $orderId)->first();

        if (!$payment) {
            Log::warning("[Razorpay Webhook] Payment not found for order: {$orderId}");
            return response()->json(['status' => 'not_found'], 200);
        }

        // Idempotency: if already processed, return 200 OK without re-processing
        if ($payment->status === 'success') {
            return response()->json(['status' => 'already_processed'], 200);
        }

        DB::transaction(function () use ($payment, $paymentId) {
            $payment->update([
                'status'             => 'success',
                'gateway_payment_id' => $paymentId,
                'paid_at'            => now(),
            ]);

            $this->recalculateInvoiceStatus($payment->invoice);
            app(DashboardService::class)->invalidate($payment->tenant_id);
        });

        return response()->json(['status' => 'processed'], 200);
    }

    /**
     * POST /api/payments/webhooks/phonepe
     */
    public function phonepeWebhook(Request $request)
    {
        $gateway = PaymentGatewayFactory::make('phonepe');
        $res     = $gateway->handleWebhook($request->all(), $request->headers->all());

        if (!$res['success']) {
            return response()->json(['status' => 'ignored'], 200);
        }

        $txnId = $res['gateway_order_id'];

        if (!$txnId) {
            return response()->json(['status' => 'no_txn_id'], 200);
        }

        $payment = Payment::where('gateway_order_id', $txnId)->first();

        if (!$payment) {
            return response()->json(['status' => 'not_found'], 200);
        }

        // Idempotency check
        if ($payment->status === 'success') {
            return response()->json(['status' => 'already_processed'], 200);
        }

        DB::transaction(function () use ($payment, $res) {
            $payment->update([
                'status'             => 'success',
                'gateway_payment_id' => $res['gateway_payment_id'],
                'paid_at'            => now(),
            ]);

            $this->recalculateInvoiceStatus($payment->invoice);
            app(DashboardService::class)->invalidate($payment->tenant_id);
        });

        return response()->json(['status' => 'processed'], 200);
    }

    /**
     * Recalculates invoice status based on all successful payments.
     */
    protected function recalculateInvoiceStatus(Invoice $invoice): void
    {
        $totalPaid = Payment::where('invoice_id', $invoice->id)
            ->where('status', 'success')
            ->sum('amount');

        if ($totalPaid >= $invoice->amount) {
            $invoice->update(['status' => 'paid']);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'partial']);
        } else {
            $invoice->update(['status' => 'pending']);
        }
    }
}
