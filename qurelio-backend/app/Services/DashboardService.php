<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Return today's dashboard statistics for a given tenant.
     * Uses tenant+date-specific cache key to prevent cross-tenant leakage.
     *
     * Cache key format: tenant:{id}:dashboard:stats:{YYYY-MM-DD}
     * TTL: 90 seconds (short enough to stay fresh, long enough to reduce DB load)
     */
    public function getStats(int $tenantId): array
    {
        $date     = today()->toDateString();
        $cacheKey = "tenant:{$tenantId}:dashboard:stats:{$date}";

        return Cache::remember($cacheKey, now()->addSeconds(90), function () use ($tenantId, $date) {
            return $this->calculateStats($tenantId, $date);
        });
    }

    /**
     * Return today's appointment schedule for a given tenant.
     * Separate cache key so schedule can be invalidated independently.
     */
    public function getTodaySchedule(int $tenantId): array
    {
        $date     = today()->toDateString();
        $cacheKey = "tenant:{$tenantId}:dashboard:schedule:{$date}";

        return Cache::remember($cacheKey, now()->addSeconds(60), function () use ($tenantId, $date) {
            return $this->calculateSchedule($tenantId, $date);
        });
    }

    /**
     * Invalidate all dashboard cache for a tenant on a specific date.
     * Called after any data mutation (appointment, patient, etc.)
     */
    public function invalidate(int $tenantId, ?string $date = null): void
    {
        $date = $date ?? today()->toDateString();

        Cache::forget("tenant:{$tenantId}:dashboard:stats:{$date}");
        Cache::forget("tenant:{$tenantId}:dashboard:schedule:{$date}");
    }

    // ─── Private calculation methods ─────────────────────────────────────────

    private function calculateStats(int $tenantId, string $date): array
    {
        // All appointment status counts for today (single query using groupBy)
        $statusCounts = Appointment::where('tenant_id', $tenantId)
            ->whereDate('scheduled_at', $date)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $appointmentsToday = array_sum($statusCounts);

        // Live Queue status counts for today
        $queueCounts = \App\Models\QueueToken::where('tenant_id', $tenantId)
            ->whereDate('created_at', $date)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $waitingToday = array_sum($queueCounts) > 0
            ? ($queueCounts['waiting'] ?? 0) + ($queueCounts['serving'] ?? 0)
            : ($statusCounts['booked'] ?? 0) + ($statusCounts['checked_in'] ?? 0);

        $completedToday = array_sum($queueCounts) > 0
            ? ($queueCounts['done'] ?? 0)
            : ($statusCounts['completed'] ?? 0);

        // New patients registered today
        $newPatientsToday = Patient::where('tenant_id', $tenantId)
            ->whereDate('created_at', $date)
            ->count();

        // Revenue today (paid invoices created today)
        $revenueToday = (float) \App\Models\Invoice::where('tenant_id', $tenantId)
            ->whereDate('created_at', $date)
            ->where('status', 'paid')
            ->sum('amount');

        // Pending payments (count and amount)
        $pendingPaymentsCount = \App\Models\Invoice::where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'partial'])
            ->count();

        $pendingPaymentsAmount = (float) \App\Models\Invoice::where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'partial'])
            ->sum('amount');

        return [
            'appointments_today'        => $appointmentsToday,
            'waiting_today'             => $waitingToday,
            'completed_today'           => $completedToday,
            'revenue_today'             => $revenueToday,
            'new_patients_today'        => $newPatientsToday,
            'pending_payments'          => $pendingPaymentsCount,
            'pending_payment_amount'    => $pendingPaymentsAmount,
            'billing_module_available'  => true,
        ];
    }

    private function calculateSchedule(int $tenantId, string $date): array
    {
        return Appointment::with([
                'patient:id,name,phone',
                'doctor:id,name',
            ])
            ->where('tenant_id', $tenantId)
            ->whereDate('scheduled_at', $date)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn ($a) => [
                'id'          => $a->id,
                'time'        => $a->scheduled_at->format('h:i A'),
                'scheduled_at'=> $a->scheduled_at->toIso8601String(),
                'patient'     => $a->patient ? ['id' => $a->patient->id, 'name' => $a->patient->name, 'phone' => $a->patient->phone] : null,
                'doctor'      => $a->doctor  ? ['id' => $a->doctor->id,  'name' => $a->doctor->name]  : null,
                'status'      => $a->status,
                'type'        => 'Consultation', // Appointment type not in schema yet; default value
            ])
            ->toArray();
    }
}
