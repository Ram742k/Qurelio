<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\OnboardingController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

// Public Health Check Endpoint
Route::get('/health', [\App\Http\Controllers\HealthController::class, 'index']);

// Unauthenticated Gateway Webhook & Callback endpoints
Route::post('/payments/webhooks/razorpay', [PaymentController::class, 'razorpayWebhook']);
Route::post('/payments/webhooks/phonepe', [PaymentController::class, 'phonepeWebhook']);
Route::post('/payments/phonepe/callback', [PaymentController::class, 'phonepeWebhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::apiResource('patients', PatientController::class);
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('prescriptions', PrescriptionController::class);
    Route::post('/prescriptions/{prescription}/share-whatsapp', [PrescriptionController::class, 'shareWhatsApp']);

    // Clinic Onboarding Wizard
    Route::get('/onboarding', [OnboardingController::class, 'index']);
    Route::put('/onboarding/clinic', [OnboardingController::class, 'saveClinic']);
    Route::put('/onboarding/working-hours', [OnboardingController::class, 'saveWorkingHours']);
    Route::post('/onboarding/complete', [OnboardingController::class, 'complete']);

    // Invoices & Online Payments
    Route::apiResource('invoices', InvoiceController::class)->except(['destroy']);
    Route::post('/invoices/{invoice}/online-payment', [PaymentController::class, 'startOnlinePayment']);
    Route::post('/invoices/{invoice}/create-order', [PaymentController::class, 'startOnlinePayment']);
    Route::post('/invoices/{invoice}/verify', [PaymentController::class, 'verifyPayment']);
    Route::get('/payments/{payment}/status', [PaymentController::class, 'getPaymentStatus']);

    // OPD Queue Management
    Route::post('/queue/tokens', [\App\Http\Controllers\QueueController::class, 'generateToken']);
    Route::get('/queue', [\App\Http\Controllers\QueueController::class, 'index']);
    Route::get('/queue/today', [\App\Http\Controllers\QueueController::class, 'today']);
    Route::get('/queue/doctor/{doctorId}', [\App\Http\Controllers\QueueController::class, 'doctorQueue']);
    Route::post('/queue/next', [\App\Http\Controllers\QueueController::class, 'callNext']);
    Route::post('/queue/{token}/serve', [\App\Http\Controllers\QueueController::class, 'serveToken']);
    Route::post('/queue/{token}/complete', [\App\Http\Controllers\QueueController::class, 'completeToken']);
    Route::post('/queue/{token}/skip', [\App\Http\Controllers\QueueController::class, 'skipToken']);

    // Doctors list for appointment form dropdown
    Route::get('/doctors', function (Request $request) {
        $tenantId = $request->user()->tenant_id;
        $doctors = User::where('tenant_id', $tenantId)
            ->role('doctor')
            ->select('id', 'name', 'phone')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $doctors,
        ]);
    });

    // Reports & Analytics Endpoints
    Route::prefix('reports')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\ReportController::class, 'dashboard']);
        Route::get('/revenue', [App\Http\Controllers\ReportController::class, 'revenue']);
        Route::get('/appointments', [App\Http\Controllers\ReportController::class, 'appointments']);
        Route::get('/patients', [App\Http\Controllers\ReportController::class, 'patients']);
        Route::get('/prescriptions', [App\Http\Controllers\ReportController::class, 'prescriptions']);
        Route::get('/payments', [App\Http\Controllers\ReportController::class, 'payments']);
        Route::get('/queue', [App\Http\Controllers\ReportController::class, 'queue']);
        Route::get('/doctor-performance', [App\Http\Controllers\ReportController::class, 'doctorPerformance']);
        Route::get('/export', [App\Http\Controllers\ReportController::class, 'export']);
    });

    // Settings Endpoints
    Route::prefix('settings')->group(function () {
        // Shared / Profile endpoints
        Route::get('/profile', [App\Http\Controllers\SettingsController::class, 'getProfile']);
        Route::put('/profile', [App\Http\Controllers\SettingsController::class, 'updateProfile']);
        Route::get('/security', [App\Http\Controllers\SettingsController::class, 'getSecurity']);
        Route::post('/security/change-password', [App\Http\Controllers\SettingsController::class, 'changePassword']);

        // Admin-only or Elevated settings
        Route::middleware('role:clinic_admin')->group(function () {
            Route::get('/general', [App\Http\Controllers\SettingsController::class, 'getGeneral']);
            Route::put('/general', [App\Http\Controllers\SettingsController::class, 'updateGeneral']);

            Route::get('/clinic', [App\Http\Controllers\SettingsController::class, 'getClinic']);
            Route::put('/clinic', [App\Http\Controllers\SettingsController::class, 'updateClinic']);

            Route::get('/working-hours', [App\Http\Controllers\SettingsController::class, 'getWorkingHours']);
            Route::put('/working-hours', [App\Http\Controllers\SettingsController::class, 'updateWorkingHours']);

            Route::get('/doctors', [App\Http\Controllers\SettingsController::class, 'getDoctors']);
            Route::post('/doctors', [App\Http\Controllers\SettingsController::class, 'addDoctor']);
            Route::put('/doctors/{doctor}', [App\Http\Controllers\SettingsController::class, 'updateDoctor']);
            Route::delete('/doctors/{doctor}', [App\Http\Controllers\SettingsController::class, 'deleteDoctor']);

            Route::get('/staff', [App\Http\Controllers\SettingsController::class, 'getStaff']);
            Route::post('/staff', [App\Http\Controllers\SettingsController::class, 'addStaff']);
            Route::put('/staff/{user}', [App\Http\Controllers\SettingsController::class, 'updateStaffRole']);

            Route::get('/billing', [App\Http\Controllers\SettingsController::class, 'getBilling']);
            Route::put('/billing', [App\Http\Controllers\SettingsController::class, 'updateBilling']);

            Route::get('/notifications', [App\Http\Controllers\SettingsController::class, 'getNotifications']);
            Route::put('/notifications', [App\Http\Controllers\SettingsController::class, 'updateNotifications']);

            Route::get('/integrations', [App\Http\Controllers\SettingsController::class, 'getIntegrations']);
            Route::put('/integrations', [App\Http\Controllers\SettingsController::class, 'updateIntegrations']);

            Route::get('/backup', [App\Http\Controllers\SettingsController::class, 'getBackup']);
            Route::post('/backup/trigger', [App\Http\Controllers\SettingsController::class, 'triggerBackup']);

            Route::get('/audit-logs', [App\Http\Controllers\SettingsController::class, 'getAuditLogs']);
        });
    });
});



