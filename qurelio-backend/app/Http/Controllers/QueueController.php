<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\QueueToken;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QueueController extends Controller
{
    /**
     * POST /api/queue/tokens
     * Generate a daily queue token for an appointment.
     */
    public function generateToken(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'required|integer',
        ]);

        $tenantId = auth()->user()->tenant_id;

        return DB::transaction(function () use ($validated, $tenantId) {
            // Retrieve appointment with doctor and patient, locking rows to prevent race conditions
            $appointment = Appointment::where('id', $validated['appointment_id'])
                ->where('tenant_id', $tenantId)
                ->lockForUpdate()
                ->first();

            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment not found or does not belong to your clinic.',
                ], 422);
            }

            // Check if token already exists for this appointment
            $existingToken = QueueToken::where('appointment_id', $appointment->id)
                ->where('tenant_id', $tenantId)
                ->first();

            if ($existingToken) {
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment already has a queue token.',
                    'data'    => $this->formatTokenResponse($existingToken),
                ]);
            }

            $doctor = $appointment->doctor;
            if (!$doctor) {
                return response()->json([
                    'success' => false,
                    'message' => 'No doctor assigned to this appointment.',
                ], 422);
            }

            // Generate daily token number for this doctor (resets daily)
            $date = today()->toDateString();
            $prefix = $this->getDoctorTokenPrefix($doctor->name);

            // Fetch count with write lock to prevent duplicate numbers
            $todayTokensCount = QueueToken::where('doctor_id', $doctor->id)
                ->where('tenant_id', $tenantId)
                ->whereDate('created_at', $date)
                ->lockForUpdate()
                ->count();

            $nextNumber = $todayTokensCount + 1;
            $tokenNumber = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

            // Create token with status = waiting
            $token = QueueToken::create([
                'tenant_id'      => $tenantId,
                'doctor_id'      => $doctor->id,
                'appointment_id' => $appointment->id,
                'token_number'   => $tokenNumber,
                'status'         => 'waiting',
            ]);

            // Update appointment status to checked_in automatically upon checking into queue
            $appointment->update(['status' => 'checked_in']);

            // Invalidate dashboard stats cache
            app(DashboardService::class)->invalidate($tenantId);

            return response()->json([
                'success' => true,
                'message' => 'Queue token generated successfully.',
                'data'    => $this->formatTokenResponse($token),
            ], 201);
        });
    }

    /**
     * GET /api/queue
     * List queue tokens for current tenant with filters.
     */
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $doctorId = $request->input('doctor_id');
        $date     = $request->input('date', today()->toDateString());
        $status   = $request->input('status');

        $query = QueueToken::with([
                'appointment:id,scheduled_at,patient_id',
                'appointment.patient:id,name,phone',
                'doctor:id,name',
            ])
            ->where('tenant_id', $tenantId)
            ->whereDate('created_at', $date)
            ->orderBy('id');

        if ($doctorId) {
            $query->where('doctor_id', $doctorId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $tokens = $query->get();

        // Group tokens by status
        $nowServing = $tokens->where('status', 'serving')->first();
        $waiting    = $tokens->where('status', 'waiting')->values();
        $completed  = $tokens->where('status', 'done')->values();
        $skipped    = $tokens->where('status', 'skipped')->values();

        // Define next patient
        $next = $waiting->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'date'          => $date,
                'now_serving'   => $nowServing ? $this->formatTokenResponse($nowServing) : null,
                'next'          => $next ? $this->formatTokenResponse($next) : null,
                'waiting'       => $waiting->map(fn($t) => $this->formatTokenResponse($t)),
                'completed'     => $completed->map(fn($t) => $this->formatTokenResponse($t)),
                'skipped'       => $skipped->map(fn($t) => $this->formatTokenResponse($t)),
                'waiting_count' => $waiting->count(),
            ]
        ]);
    }

    /**
     * GET /api/queue/today
     */
    public function today(Request $request)
    {
        return $this->index($request);
    }

    /**
     * GET /api/queue/doctor/{doctorId}
     */
    public function doctorQueue(Request $request, $doctorId)
    {
        $tenantId = auth()->user()->tenant_id;

        // Verify doctor belongs to tenant
        $doctor = User::where('id', $doctorId)->where('tenant_id', $tenantId)->first();
        if (!$doctor) {
            return response()->json(['success' => false, 'message' => 'Doctor not found.'], 404);
        }

        $request->merge(['doctor_id' => $doctorId]);
        return $this->index($request);
    }

    /**
     * POST /api/queue/{token}/serve
     */
    public function serveToken(QueueToken $token)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($token->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ($token->status !== 'waiting') {
            return response()->json(['success' => false, 'message' => 'Only waiting patients can be served.'], 422);
        }

        return DB::transaction(function () use ($token, $tenantId) {
            // Auto-complete/transition any currently serving token for this doctor
            QueueToken::where('doctor_id', $token->doctor_id)
                ->where('tenant_id', $tenantId)
                ->where('status', 'serving')
                ->update(['status' => 'done']);

            $token->update(['status' => 'serving']);

            // Invalidate dashboard cache
            app(DashboardService::class)->invalidate($tenantId);

            return response()->json([
                'success' => true,
                'message' => "Token {$token->token_number} is now serving.",
                'data'    => $this->formatTokenResponse($token),
            ]);
        });
    }

    /**
     * POST /api/queue/next
     * Call next waiting patient for a doctor.
     */
    public function callNext(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|integer',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $doctorId = $validated['doctor_id'];

        return DB::transaction(function () use ($doctorId, $tenantId) {
            // Find earliest eligible waiting token for the doctor, locking the row
            $nextToken = QueueToken::where('doctor_id', $doctorId)
                ->where('tenant_id', $tenantId)
                ->where('status', 'waiting')
                ->whereDate('created_at', today())
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if (!$nextToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'No patients currently waiting in queue.',
                ], 422);
            }

            // Auto-complete current serving patient
            QueueToken::where('doctor_id', $doctorId)
                ->where('tenant_id', $tenantId)
                ->where('status', 'serving')
                ->update(['status' => 'done']);

            $nextToken->update(['status' => 'serving']);

            // Invalidate dashboard cache
            app(DashboardService::class)->invalidate($tenantId);

            return response()->json([
                'success' => true,
                'message' => "Token {$nextToken->token_number} is now serving.",
                'data'    => $this->formatTokenResponse($nextToken),
            ]);
        });
    }

    /**
     * POST /api/queue/{token}/complete
     */
    public function completeToken(QueueToken $token)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($token->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ($token->status !== 'serving') {
            return response()->json(['success' => false, 'message' => 'Only serving patients can be marked completed.'], 422);
        }

        return DB::transaction(function () use ($token, $tenantId) {
            $token->update(['status' => 'done']);

            // Sync appointment status to completed
            if ($token->appointment) {
                $token->appointment->update(['status' => 'completed']);
            }

            app(DashboardService::class)->invalidate($tenantId);

            return response()->json([
                'success' => true,
                'message' => "Token {$token->token_number} consultation completed.",
                'data'    => $this->formatTokenResponse($token),
            ]);
        });
    }

    /**
     * POST /api/queue/{token}/skip
     */
    public function skipToken(QueueToken $token)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($token->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if (!in_array($token->status, ['waiting', 'serving'])) {
            return response()->json(['success' => false, 'message' => 'Cannot skip a token in status: ' . $token->status], 422);
        }

        return DB::transaction(function () use ($token, $tenantId) {
            $token->update(['status' => 'skipped']);

            app(DashboardService::class)->invalidate($tenantId);

            return response()->json([
                'success' => true,
                'message' => "Token {$token->token_number} has been skipped.",
                'data'    => $this->formatTokenResponse($token),
            ]);
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function getDoctorTokenPrefix(string $doctorName): string
    {
        // Strip out "Dr." prefixes to find actual doctor name initial
        $clean = preg_replace('/^dr\.\s+/i', '', trim($doctorName));
        $firstChar = substr($clean, 0, 1);
        return !empty($firstChar) ? strtoupper($firstChar) : 'T';
    }

    private function formatTokenResponse(QueueToken $token): array
    {
        return [
            'id'             => $token->id,
            'token_number'   => $token->token_number,
            'status'         => $token->status,
            'appointment_id' => $token->appointment_id,
            'scheduled_at'   => $token->appointment->scheduled_at ?? null,
            'patient'        => $token->appointment && $token->appointment->patient ? [
                'id'   => $token->appointment->patient->id,
                'name' => $token->appointment->patient->name,
                'phone'=> $token->appointment->patient->phone,
            ] : null,
            'doctor'         => $token->doctor ? [
                'id'   => $token->doctor->id,
                'name' => $token->doctor->name,
            ] : null,
        ];
    }
}
