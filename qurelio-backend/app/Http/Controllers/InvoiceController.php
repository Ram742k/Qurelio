<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Patient;
use App\Services\DashboardService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with('patient:id,name,phone')->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        $invoices = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $invoices,
        ]);
    }

    public function show(Invoice $invoice)
    {
        $invoice->load('patient:id,name,phone,gender,age');

        return response()->json([
            'success' => true,
            'data'    => $invoice,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'patient_id'     => 'required|integer',
            'amount'         => 'required|numeric|min:0',
            'payment_method' => 'nullable|in:cash,upi,card,insurance',
            'status'         => 'sometimes|in:paid,pending,partial,refunded',
        ]);

        // Tenant isolation: check patient belongs to this tenant
        $patient = Patient::where('id', $validated['patient_id'])
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Patient not found or does not belong to your clinic.',
            ], 422);
        }

        $validated['tenant_id']      = $tenantId;
        $validated['invoice_number'] = 'INV-' . strtoupper(uniqid());
        $validated['status']         = $validated['status'] ?? 'pending';

        $invoice = Invoice::create($validated);

        // Invalidate dashboard cache
        app(DashboardService::class)->invalidate($tenantId);

        return response()->json([
            'success' => true,
            'message' => 'Invoice created successfully.',
            'data'    => $invoice->load('patient:id,name,phone'),
        ], 201);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'status'         => 'sometimes|in:paid,pending,partial,refunded',
            'payment_method' => 'nullable|in:cash,upi,card,insurance',
            'amount'         => 'sometimes|numeric|min:0',
        ]);

        $invoice->update($validated);

        // Invalidate dashboard cache
        app(DashboardService::class)->invalidate(auth()->user()->tenant_id);

        return response()->json([
            'success' => true,
            'message' => 'Invoice updated successfully.',
            'data'    => $invoice->load('patient:id,name,phone'),
        ]);
    }
}

