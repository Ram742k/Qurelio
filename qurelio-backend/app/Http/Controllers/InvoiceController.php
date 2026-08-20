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

    public function downloadPdf(Request $request, Invoice $invoice)
    {
        if ($invoice->tenant_id !== auth()->user()->tenant_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $html = \App\Services\InvoicePdfService::generateHtml($invoice);

        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'inline; filename="Invoice-' . $invoice->invoice_number . '.html"');
    }

    public function exportGstCsv(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $invoices = Invoice::where('tenant_id', $tenantId)
            ->with(['patient:id,name,phone'])
            ->orderBy('created_at', 'desc')
            ->get();

        $csvHeader = ["Invoice Number", "Date", "Patient Name", "Phone", "Subtotal", "GST Tax (18%)", "Total Amount", "Paid Amount", "Status", "Payment Method"];
        $rows = [$csvHeader];

        foreach ($invoices as $inv) {
            $subtotal = $inv->amount ?? $inv->total_amount;
            $tax = ($subtotal * 18) / 100;
            $rows[] = [
                $inv->invoice_number,
                $inv->created_at ? $inv->created_at->format('Y-m-d') : date('Y-m-d'),
                $inv->patient->name ?? 'N/A',
                $inv->patient->phone ?? '',
                number_format($subtotal, 2),
                number_format($tax, 2),
                number_format($subtotal + $tax, 2),
                number_format($inv->paid_amount ?? 0, 2),
                strtoupper($inv->status),
                strtoupper($inv->payment_method ?? 'N/A'),
            ];
        }

        $csvOutput = "";
        foreach ($rows as $row) {
            $csvOutput .= implode(',', array_map(fn($v) => '"' . str_replace('"', '""', $v) . '"', $row)) . "\n";
        }

        return response($csvOutput)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="GST_Invoice_Report_' . date('Y-m-d') . '.csv"');
    }
}


