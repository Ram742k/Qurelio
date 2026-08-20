<?php

namespace App\Services;

use App\Models\Invoice;

class InvoicePdfService
{
    /**
     * Generate HTML representation of a GST compliant Tax Invoice for PDF download or printing.
     */
    public static function generateHtml(Invoice $invoice): string
    {
        $invoice->load(['patient', 'tenant', 'items', 'payments']);

        $tenant  = $invoice->tenant;
        $patient = $invoice->patient;
        $items   = $invoice->items ?? [];
        $payments = $invoice->payments ?? [];

        $itemsHtml = '';
        $subtotal = 0;
        foreach ($items as $idx => $item) {
            $num   = $idx + 1;
            $desc  = htmlspecialchars($item->description ?? 'Consultation Fee');
            $qty   = $item->quantity ?? 1;
            $rate  = number_format($item->unit_price ?? $item->amount, 2);
            $amt   = number_format(($item->unit_price ?? $item->amount) * $qty, 2);
            $subtotal += ($item->unit_price ?? $item->amount) * $qty;

            $itemsHtml .= "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{$num}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{$desc}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{$qty}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>₹{$rate}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>₹{$amt}</td>
                </tr>";
        }

        if (empty($itemsHtml)) {
            $itemsHtml = "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>1</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>OPD Consultation & Medical Services</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>1</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>₹" . number_format($invoice->total_amount, 2) . "</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>₹" . number_format($invoice->total_amount, 2) . "</td>
                </tr>";
            $subtotal = $invoice->total_amount;
        }

        $taxRate = $invoice->tax_rate ?? 18; // default 18% GST if applicable
        $taxAmount = ($subtotal * $taxRate) / 100;
        $cgst = number_format($taxAmount / 2, 2);
        $sgst = number_format($taxAmount / 2, 2);
        $grandTotal = number_format($subtotal + $taxAmount, 2);
        $paidAmount = number_format($invoice->paid_amount ?? 0, 2);
        $balance = number_format(($subtotal + $taxAmount) - ($invoice->paid_amount ?? 0), 2);

        $dateStr = $invoice->created_at ? $invoice->created_at->format('d M Y') : date('d M Y');

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Tax Invoice #{$invoice->invoice_number}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 15px; margin-bottom: 20px; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #0f766e; }
        .invoice-title { font-size: 22px; font-weight: bold; color: #0f766e; text-align: right; }
        .meta-table { width: 100%; margin-bottom: 20px; }
        .meta-table td { vertical-align: top; padding: 5px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th { background: #ccfbf1; color: #0f766e; text-align: left; padding: 10px; }
        .summary-table { width: 40%; margin-left: auto; margin-top: 20px; border-collapse: collapse; }
        .summary-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 12px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class='header'>
        <div>
            <div class='clinic-name'>{$tenant->name}</div>
            <div>{$tenant->address}, {$tenant->city}</div>
            <div>GSTIN / Tax ID: " . ($tenant->settings['gstin'] ?? 'N/A') . "</div>
            <div>Phone: {$tenant->phone}</div>
        </div>
        <div>
            <div class='invoice-title'>TAX INVOICE</div>
            <div style='text-align: right; color: #64748b;'>Invoice #: {$invoice->invoice_number}</div>
            <div style='text-align: right; color: #64748b;'>Date: {$dateStr}</div>
        </div>
    </div>

    <table class='meta-table'>
        <tr>
            <td width='50%'>
                <strong>Billed To:</strong><br>
                Name: {$patient->name}<br>
                Phone: {$patient->phone}<br>
                Gender/Age: {$patient->gender} / {$patient->age} yrs
            </td>
            <td width='50%' style='text-align: right;'>
                <strong>Payment Status:</strong> <span style='text-transform: uppercase; font-weight: bold; color: " . ($invoice->status === 'paid' ? '#16a34a' : '#d97706') . ";'>{$invoice->status}</span><br>
                Payment Method: " . strtoupper($invoice->payment_method ?? 'Cash/Online') . "
            </td>
        </tr>
    </table>

    <table class='table'>
        <thead>
            <tr>
                <th>#</th>
                <th>Item / Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {$itemsHtml}
        </tbody>
    </table>

    <table class='summary-table'>
        <tr>
            <td><strong>Subtotal:</strong></td>
            <td style='text-align: right;'>₹" . number_format($subtotal, 2) . "</td>
        </tr>
        <tr>
            <td>CGST (9%):</td>
            <td style='text-align: right;'>₹{$cgst}</td>
        </tr>
        <tr>
            <td>SGST (9%):</td>
            <td style='text-align: right;'>₹{$sgst}</td>
        </tr>
        <tr style='font-size: 16px; font-weight: bold;'>
            <td>Grand Total:</td>
            <td style='text-align: right; color: #0f766e;'>₹{$grandTotal}</td>
        </tr>
        <tr>
            <td>Amount Paid:</td>
            <td style='text-align: right;'>₹{$paidAmount}</td>
        </tr>
        <tr style='font-weight: bold;'>
            <td>Balance Due:</td>
            <td style='text-align: right; color: #dc2626;'>₹{$balance}</td>
        </tr>
    </table>

    <div class='footer'>
        Thank you for trusting {$tenant->name}. This is a computer-generated tax invoice.
    </div>
</body>
</html>";
    }
}
