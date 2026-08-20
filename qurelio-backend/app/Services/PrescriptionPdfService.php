<?php

namespace App\Services;

use App\Models\Prescription;

class PrescriptionPdfService
{
    /**
     * Generate HTML representation of a branded prescription for PDF rendering or print view.
     */
    public static function generateHtml(Prescription $prescription): string
    {
        $prescription->load(['patient', 'doctor', 'tenant']);

        $patient = $prescription->patient;
        $tenant  = $prescription->tenant;
        $doctor  = $prescription->doctor;
        $medicines = is_array($prescription->medicines) ? $prescription->medicines : json_decode($prescription->medicines ?? '[]', true);

        $medicinesHtml = '';
        foreach ($medicines as $idx => $med) {
            $num = $idx + 1;
            $name = htmlspecialchars($med['name'] ?? '');
            $dosage = htmlspecialchars($med['dosage'] ?? '1-0-1');
            $duration = htmlspecialchars($med['duration'] ?? '5 days');
            $instruction = htmlspecialchars($med['instruction'] ?? 'After Food');

            $medicinesHtml .= "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{$num}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'><strong>{$name}</strong></td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{$dosage}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{$duration}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{$instruction}</td>
                </tr>";
        }

        $dateStr = $prescription->created_at ? $prescription->created_at->format('d M Y') : date('d M Y');

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Prescription #{$prescription->id}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
        .clinic-name { font-size: 24px; font-weight: bold; color: #0284c7; }
        .patient-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th { background: #e0f2fe; color: #0369a1; text-align: left; padding: 10px; }
        .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 12px; color: #64748b; text-align: center; }
        .doctor-signature { text-align: right; margin-top: 40px; }
    </style>
</head>
<body>
    <div class='header'>
        <div>
            <div class='clinic-name'>{$tenant->name}</div>
            <div>{$tenant->address}, {$tenant->city}</div>
            <div>Phone: {$tenant->phone} | Email: {$tenant->email}</div>
        </div>
        <div style='text-align: right;'>
            <div style='font-size: 18px; font-weight: bold;'>Dr. {$doctor->name}</div>
            <div style='color: #64748b;'>Date: {$dateStr}</div>
            <div style='color: #64748b;'>Rx #: RX-{$prescription->id}</div>
        </div>
    </div>

    <div class='patient-info'>
        <strong>Patient Name:</strong> {$patient->name} &nbsp;|&nbsp;
        <strong>Phone:</strong> {$patient->phone} &nbsp;|&nbsp;
        <strong>Gender/Age:</strong> {$patient->gender} / {$patient->age} yrs
    </div>

    <h3>Prescribed Medications</h3>
    <table class='table'>
        <thead>
            <tr>
                <th>#</th>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Instructions</th>
            </tr>
        </thead>
        <tbody>
            {$medicinesHtml}
        </tbody>
    </table>

    " . (!empty($prescription->notes) ? "<div style='margin-top: 20px;'><strong>Clinical Advice / Notes:</strong><p>{$prescription->notes}</p></div>" : "") . "

    <div class='doctor-signature'>
        <p>_______________________</p>
        <p><strong>Dr. {$doctor->name}</strong><br>Authorized Signature</p>
    </div>

    <div class='footer'>
        Generated via Qurelio Small Clinic SaaS — Medical Confidentiality Applies
    </div>
</body>
</html>";
    }
}
