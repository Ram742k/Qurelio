<?php

namespace App\Http\Controllers;

use App\Models\MedicineMaster;
use App\Services\MedicineSearchService;
use Illuminate\Http\Request;

class MedicineMasterController extends Controller
{
    protected MedicineSearchService $searchService;

    public function __construct(MedicineSearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    /**
     * GET /api/medicines/search?q=dolo
     * Fast autocomplete endpoint for prescription builder.
     */
    public function search(Request $request)
    {
        $query = $request->query('q', '');
        $tenantId = auth()->check() ? auth()->user()->tenant_id : null;

        $results = $this->searchService->search($query, $tenantId);

        return response()->json([
            'success' => true,
            'data'    => $results,
        ]);
    }

    /**
     * POST /api/medicines/custom
     * Instant creation of custom medicine by doctor/admin during prescription building.
     */
    public function storeCustom(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'brand_name'   => 'required|string|max:150',
            'generic_name' => 'nullable|string|max:150',
            'strength'     => 'nullable|string|max:50',
            'form'         => 'nullable|string|in:Tablet,Capsule,Syrup,Injection,Ointment,Drops,Sachet',
            'unit'         => 'nullable|string|max:20',
        ]);

        $medicine = MedicineMaster::create([
            'tenant_id'    => $tenantId,
            'brand_name'   => $validated['brand_name'],
            'generic_name' => $validated['generic_name'] ?? $validated['brand_name'],
            'strength'     => $validated['strength'] ?? '',
            'form'         => $validated['form'] ?? 'Tablet',
            'unit'         => $validated['unit'] ?? 'mg',
            'is_custom'    => true,
            'is_active'    => true,
        ]);

        $this->searchService->invalidateCache($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Custom medicine added successfully.',
            'data'    => [
                'id'           => $medicine->id,
                'brand_name'   => $medicine->brand_name,
                'generic_name' => $medicine->generic_name,
                'strength'     => $medicine->strength,
                'form'         => $medicine->form,
                'is_custom'    => true,
                'display_label'=> $medicine->brand_name . ($medicine->strength ? ' ' . $medicine->strength : ''),
            ],
        ], 201);
    }

    /**
     * GET /api/medicines
     * Paginated index for Medicine Master management page.
     */
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $query = MedicineMaster::where(function ($q) use ($tenantId) {
            $q->whereNull('tenant_id')->orWhere('tenant_id', $tenantId);
        });

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('brand_name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('strength', 'like', "%{$search}%");
            });
        }

        if ($request->filled('form')) {
            $query->where('form', $request->form);
        }

        if ($request->filled('custom_only') && $request->custom_only == 'true') {
            $query->where('is_custom', true);
        }

        $medicines = $query->orderBy('brand_name')->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $medicines,
        ]);
    }

    /**
     * POST /api/medicines
     * Create a new medicine entry (Clinic Admin).
     */
    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'brand_name'   => 'required|string|max:150',
            'generic_name' => 'required|string|max:150',
            'strength'     => 'nullable|string|max:50',
            'form'         => 'required|string|in:Tablet,Capsule,Syrup,Injection,Ointment,Drops,Sachet',
            'unit'         => 'nullable|string|max:20',
            'manufacturer' => 'nullable|string|max:100',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['is_custom'] = true;
        $validated['is_active'] = true;

        $medicine = MedicineMaster::create($validated);
        $this->searchService->invalidateCache($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Medicine entry created successfully.',
            'data'    => $medicine,
        ], 201);
    }

    /**
     * PUT /api/medicines/{medicine}
     * Update an existing medicine entry.
     */
    public function update(Request $request, MedicineMaster $medicine)
    {
        $tenantId = auth()->user()->tenant_id;

        // Prevent editing global catalog if not tenant-owned
        if ($medicine->tenant_id !== null && $medicine->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'brand_name'   => 'sometimes|string|max:150',
            'generic_name' => 'sometimes|string|max:150',
            'strength'     => 'nullable|string|max:50',
            'form'         => 'sometimes|string|in:Tablet,Capsule,Syrup,Injection,Ointment,Drops,Sachet',
            'unit'         => 'nullable|string|max:20',
            'manufacturer' => 'nullable|string|max:100',
            'is_active'    => 'sometimes|boolean',
        ]);

        $medicine->update($validated);
        $this->searchService->invalidateCache($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Medicine updated successfully.',
            'data'    => $medicine,
        ]);
    }

    /**
     * DELETE /api/medicines/{medicine}
     * Deactivate or delete medicine entry.
     */
    public function destroy(Request $request, MedicineMaster $medicine)
    {
        $tenantId = auth()->user()->tenant_id;

        if ($medicine->tenant_id !== null && $medicine->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $medicine->update(['is_active' => false]);
        $this->searchService->invalidateCache($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Medicine entry deactivated.',
        ]);
    }
}
