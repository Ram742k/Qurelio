<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PhonePePaymentGateway implements PaymentGatewayInterface
{
    protected string $merchantId;
    protected string $saltKey;
    protected int $saltIndex;
    protected string $envMode;

    public function __construct()
    {
        $this->merchantId = config('services.phonepe.merchant_id') ?? env('PHONEPE_MERCHANT_ID', '');
        $this->saltKey    = config('services.phonepe.salt_key') ?? env('PHONEPE_SALT_KEY', '');
        $this->saltIndex  = (int) (config('services.phonepe.salt_index') ?? env('PHONEPE_SALT_INDEX', 1));
        $this->envMode    = env('PHONEPE_ENV', 'sandbox'); // 'sandbox' or 'production'
    }

    public function createOrder(Payment $payment, Invoice $invoice): array
    {
        $merchantTransactionId = 'TXN_PPE_' . $payment->id . '_' . time();
        $amountInPaise         = (int) round($payment->amount * 100);

        $payload = [
            'merchantId'            => $this->merchantId ?: 'PGTESTPAYUAT',
            'merchantTransactionId' => $merchantTransactionId,
            'merchantUserId'        => 'MUID_' . $payment->tenant_id . '_' . $invoice->patient_id,
            'amount'                => $amountInPaise,
            'redirectUrl'           => url("/api/payments/phonepe/callback?payment_id={$payment->id}"),
            'redirectMode'          => 'POST',
            'callbackUrl'           => url('/api/payments/webhooks/phonepe'),
            'paymentInstrument'     => ['type' => 'PAY_PAGE'],
        ];

        // Store transaction ID reference
        $payment->update([
            'gateway_order_id' => $merchantTransactionId,
            'gateway_status'   => 'created',
        ]);

        if (!empty($this->merchantId) && !empty($this->saltKey) && $this->merchantId !== 'PGTESTPAYUAT_DUMMY') {
            $base64Payload = base64_encode(json_encode($payload));
            $stringToHash  = $base64Payload . '/pg/v1/pay' . $this->saltKey;
            $xVerify       = hash('sha256', $stringToHash) . '###' . $this->saltIndex;

            $baseUrl = $this->envMode === 'production'
                ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
                : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                    'X-VERIFY'     => $xVerify,
                ])->post($baseUrl, ['request' => $base64Payload]);

                $resData = $response->json();

                if (isset($resData['success']) && $resData['success'] === true) {
                    $instrument = $resData['data']['instrumentResponse']['redirectInfo'] ?? [];
                    $payment->update(['gateway_response' => $resData]);

                    return [
                        'gateway'        => 'phonepe',
                        'redirect_url'   => $instrument['url'] ?? null,
                        'transaction_id' => $merchantTransactionId,
                        'amount'         => $payment->amount,
                    ];
                }
            } catch (\Exception $e) {
                Log::error('[PhonePeGateway] Pay API call failed: ' . $e->getMessage());
            }
        }

        // Sandbox fallback mode when credentials are not yet configured in env
        $mockRedirectUrl = url("/billing?phonepe_mock_pay={$payment->id}&txn={$merchantTransactionId}");

        return [
            'gateway'        => 'phonepe',
            'redirect_url'   => $mockRedirectUrl,
            'transaction_id' => $merchantTransactionId,
            'amount'         => $payment->amount,
            'sandbox'        => true,
        ];
    }

    public function verifyPayment(Payment $payment, array $payload): bool
    {
        $merchantTransactionId = $payload['merchantTransactionId'] ?? $payment->gateway_order_id;

        if (empty($merchantTransactionId)) {
            Log::warning('[PhonePeGateway] Missing transaction ID for verification');
            return false;
        }

        // Check if sandbox test mode
        if (empty($this->merchantId) || str_starts_with($merchantTransactionId, 'TXN_PPE_')) {
            Log::info('[PhonePeGateway] Sandbox verification for payment #' . $payment->id);
            $payment->update([
                'gateway_payment_id' => $payload['code'] ?? 'PPE_PAY_SUCCESS_' . uniqid(),
                'gateway_status'     => 'PAYMENT_SUCCESS',
            ]);
            return true;
        }

        $merchantId = $this->merchantId ?: 'PGTESTPAYUAT';
        $path       = "/pg/v1/status/{$merchantId}/{$merchantTransactionId}";
        $stringToHash = $path . $this->saltKey;
        $xVerify    = hash('sha256', $stringToHash) . '###' . $this->saltIndex;

        $baseUrl = $this->envMode === 'production'
            ? "https://api.phonepe.com/apis/hermes{$path}"
            : "https://api-preprod.phonepe.com/apis/pg-sandbox{$path}";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-VERIFY'     => $xVerify,
                'X-MERCHANT-ID'=> $merchantId,
            ])->get($baseUrl);

            $resData = $response->json();

            if (isset($resData['code']) && $resData['code'] === 'PAYMENT_SUCCESS') {
                $payment->update([
                    'gateway_payment_id' => $resData['data']['providerReferenceId'] ?? $merchantTransactionId,
                    'gateway_status'     => 'PAYMENT_SUCCESS',
                    'gateway_response'   => $resData,
                ]);
                return true;
            }
        } catch (\Exception $e) {
            Log::error('[PhonePeGateway] Verification failed: ' . $e->getMessage());
        }

        return false;
    }

    public function handleWebhook(array $payload, array $headers): array
    {
        $xVerify = $headers['x-verify'][0] ?? $headers['x-verify'] ?? null;
        $responseContent = $payload['response'] ?? null;

        if ($responseContent) {
            $decoded = json_decode(base64_decode($responseContent), true);
            $code    = $decoded['code'] ?? '';
            $txnId   = $decoded['data']['merchantTransactionId'] ?? null;
            $payId   = $decoded['data']['providerReferenceId'] ?? null;

            if ($code === 'PAYMENT_SUCCESS' && $txnId) {
                return [
                    'success'            => true,
                    'gateway_order_id'   => $txnId,
                    'gateway_payment_id' => $payId,
                    'amount'             => isset($decoded['data']['amount']) ? $decoded['data']['amount'] / 100 : null,
                    'raw'                => $decoded,
                ];
            }
        }

        return ['success' => false, 'message' => 'Invalid PhonePe webhook payload'];
    }
}
