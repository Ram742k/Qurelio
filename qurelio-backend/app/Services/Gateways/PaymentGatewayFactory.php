<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGatewayInterface;
use InvalidArgumentException;

class PaymentGatewayFactory
{
    /**
     * Resolve payment gateway instance by driver name.
     *
     * @param string $gateway Name of the gateway ('razorpay' | 'phonepe')
     * @return PaymentGatewayInterface
     */
    public static function make(string $gateway): PaymentGatewayInterface
    {
        return match (strtolower($gateway)) {
            'razorpay' => new RazorpayPaymentGateway(),
            'phonepe'  => new PhonePePaymentGateway(),
            default    => throw new InvalidArgumentException("Unsupported payment gateway [{$gateway}]. Supported gateways: razorpay, phonepe."),
        };
    }
}
