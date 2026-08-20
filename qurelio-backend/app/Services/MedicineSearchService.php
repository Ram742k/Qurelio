<?php

namespace App\Services;

use App\Models\MedicineMaster;
use Illuminate\Support\Facades\Cache;

class MedicineSearchService
{
    /**
     * Search medicine master with 10-result limit and Redis caching.
     */
    public function search(string $query, ?int $tenantId = null): array
    {
        $cleanQuery = strtolower(trim($query));
        if (strlen($cleanQuery) < 2) {
            return [];
        }

        $cacheKey = "medicine_search:" . ($tenantId ?? 'global') . ":" . md5($cleanQuery);

        return Cache::remember($cacheKey, 3600, function () use ($cleanQuery, $tenantId) {
            return MedicineMaster::query()
                ->where(function ($q) use ($tenantId) {
                    $q->whereNull('tenant_id');
                    if ($tenantId) {
                        $q->orWhere('tenant_id', $tenantId);
                    }
                })
                ->where('is_active', true)
                ->where(function ($q) use ($cleanQuery) {
                    $q->where('brand_name', 'like', "{$cleanQuery}%")
                      ->orWhere('generic_name', 'like', "{$cleanQuery}%")
                      ->orWhere('brand_name', 'like', "%{$cleanQuery}%");
                })
                ->limit(10)
                ->get(['id', 'brand_name', 'generic_name', 'strength', 'form', 'unit', 'is_custom'])
                ->map(function ($med) {
                    return [
                        'id'           => $med->id,
                        'brand_name'   => $med->brand_name,
                        'generic_name' => $med->generic_name,
                        'strength'     => $med->strength ?? '',
                        'form'         => $med->form ?? 'Tablet',
                        'unit'         => $med->unit ?? 'mg',
                        'is_custom'    => (bool) $med->is_custom,
                        'display_label'=> $med->brand_name . ($med->strength ? ' ' . $med->strength : ''),
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Clear search cache when a new medicine is added or updated.
     */
    public function invalidateCache(?int $tenantId = null): void
    {
        // Simple cache flush tag or key reset if required
        try {
            Cache::forget("medicine_search:" . ($tenantId ?? 'global'));
        } catch (\Throwable $e) {
            // Non-blocking catch
        }
    }
}
