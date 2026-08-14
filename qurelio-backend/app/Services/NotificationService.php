<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * NotificationService — SMS/WhatsApp abstraction layer.
 *
 * In development, uses the 'log' driver by default.
 * In production, swap the driver by setting NOTIFICATION_DRIVER in .env
 * and implementing a new driver class.
 *
 * Supported drivers: log (default), twilio (future), infobip (future)
 */
class NotificationService
{
    protected string $driver;

    public function __construct()
    {
        // Read driver from config; defaults to 'log' for safe dev usage
        $this->driver = config('app.notification_driver', 'log');
    }

    /**
     * Send a notification to the given phone number.
     *
     * @param string $phone   Recipient phone number
     * @param string $message Message content
     * @param array  $context Optional metadata (e.g., appointment_id, tenant_id)
     */
    public function send(string $phone, string $message, array $context = []): void
    {
        match ($this->driver) {
            'log'    => $this->sendViaLog($phone, $message, $context),
            // Future: 'twilio' => $this->sendViaTwilio($phone, $message),
            // Future: 'infobip' => $this->sendViaInfobip($phone, $message),
            default  => $this->sendViaLog($phone, $message, $context),
        };
    }

    /**
     * Log driver — used during development.
     * Outputs the SMS/WhatsApp message to laravel.log
     */
    protected function sendViaLog(string $phone, string $message, array $context = []): void
    {
        Log::channel('daily')->info('[NotificationService] SMS Reminder', [
            'driver'  => 'log',
            'to'      => $phone,
            'message' => $message,
            'context' => $context,
        ]);
    }

    // -----------------------------------------------------------------------
    // FUTURE INTEGRATION EXAMPLE (do not uncomment without real credentials):
    // -----------------------------------------------------------------------
    //
    // protected function sendViaTwilio(string $phone, string $message): void
    // {
    //     $twilio = new \Twilio\Rest\Client(
    //         config('services.twilio.sid'),
    //         config('services.twilio.token')
    //     );
    //     $twilio->messages->create($phone, [
    //         'from' => config('services.twilio.from'),
    //         'body' => $message,
    //     ]);
    // }
}
