<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class ReportCacheService
{
    /**
     * Get or remember report data in Redis/Cache per tenant
     */
    public static function remember(int $tenantId, string $reportType, string $rangeKey, \Closure $callback, int $ttlSeconds = 300)
    {
        $key = "tenant:{$tenantId}:reports:{$reportType}:{$rangeKey}";

        return Cache::remember($key, $ttlSeconds, $callback);
    }

    /**
     * Invalidate report cache for a given tenant
     */
    public static function invalidateTenantReports(int $tenantId): void
    {
        // Flush tenant-specific report cache patterns or common range keys
        $types = ['dashboard', 'revenue', 'appointments', 'patients', 'prescriptions', 'payments', 'queue', 'doctor-performance'];
        $ranges = ['today', 'yesterday', 'last_7_days', 'last_30_days', 'all'];

        foreach ($types as $type) {
            foreach ($ranges as $range) {
                Cache::forget("tenant:{$tenantId}:reports:{$type}:{$range}");
            }
        }
    }
}
