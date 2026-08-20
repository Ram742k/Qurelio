<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Appointment;
use App\Models\QueueToken;
use App\Models\Invoice;
use App\Models\Prescription;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    /**
     * GET /api/global-search?q=query
     * Fast multi-entity global search across Patients, Appointments, OPD Queue, Invoices, and Prescriptions.
     */
    public function search(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $query    = trim($request->query('q', ''));

        if (strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data'    => [
                    'patients'      => [],
                    'appointments'  => [],
                    'queue'         => [],
                    'invoices'      => [],
                    'prescriptions' => [],
                ],
            ]);
        }

        // 1. Search Patients
        $patients = Patient::where('tenant_id', $tenantId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%")
                  ->orWhere('city', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'name', 'phone', 'gender', 'age'])
            ->map(function ($p) {
                return [
                  'id'          => $p->id,
                  'title'       => $p->name,
                  'subtitle'    => ($p->phone ? "Phone: {$p->phone}" : "") . ($p->gender ? " • {$p->gender}, {$p->age} yrs" : ""),
                  'type'        => 'patient',
                  'target_tab'  => 'patients',
                ];
            });

        // 2. Search Appointments
        $appointments = Appointment::where('tenant_id', $tenantId)
            ->with(['patient:id,name,phone', 'doctor:id,name'])
            ->where(function ($q) use ($query) {
                $q->where('appointment_date', 'like', "%{$query}%")
                  ->orWhere('status', 'like', "%{$query}%")
                  ->orWhereHas('patient', function ($pq) use ($query) {
                      $pq->where('name', 'like', "%{$query}%")->orWhere('phone', 'like', "%{$query}%");
                  });
            })
            ->limit(5)
            ->get()
            ->map(function ($a) {
                return [
                  'id'          => $a->id,
                  'title'       => "Appointment #" . $a->id . " - " . ($a->patient->name ?? 'Patient'),
                  'subtitle'    => "Date: {$a->appointment_date} {$a->appointment_time} • Status: " . ucfirst($a->status),
                  'type'        => 'appointment',
                  'target_tab'  => 'appointments',
                ];
            });

        // 3. Search Queue Tokens
        $queueTokens = QueueToken::where('tenant_id', $tenantId)
            ->with(['patient:id,name,phone'])
            ->where(function ($q) use ($query) {
                $q->where('token_number', 'like', "%{$query}%")
                  ->orWhere('status', 'like', "%{$query}%")
                  ->orWhereHas('patient', function ($pq) use ($query) {
                      $pq->where('name', 'like', "%{$query}%");
                  });
            })
            ->limit(5)
            ->get()
            ->map(function ($t) {
                return [
                  'id'          => $t->id,
                  'title'       => "Token {$t->token_number} - " . ($t->patient->name ?? 'Walk-in Patient'),
                  'subtitle'    => "Status: " . ucfirst($t->status) . " • Room: " . ($t->doctor_room ?? '1'),
                  'type'        => 'queue',
                  'target_tab'  => 'queue',
                ];
            });

        // 4. Search Invoices
        $invoices = Invoice::where('tenant_id', $tenantId)
            ->with(['patient:id,name'])
            ->where(function ($q) use ($query) {
                $q->where('invoice_number', 'like', "%{$query}%")
                  ->orWhere('status', 'like', "%{$query}%")
                  ->orWhereHas('patient', function ($pq) use ($query) {
                      $pq->where('name', 'like', "%{$query}%");
                  });
            })
            ->limit(5)
            ->get()
            ->map(function ($i) {
                return [
                  'id'          => $i->id,
                  'title'       => "Invoice #{$i->invoice_number}",
                  'subtitle'    => "Patient: " . ($i->patient->name ?? 'N/A') . " • Amount: ₹" . number_format($i->amount ?? $i->total_amount, 2) . " (" . strtoupper($i->status) . ")",
                  'type'        => 'invoice',
                  'target_tab'  => 'billing',
                ];
            });

        // 5. Search Prescriptions
        $prescriptions = Prescription::where('tenant_id', $tenantId)
            ->with(['patient:id,name', 'doctor:id,name'])
            ->where(function ($q) use ($query) {
                $q->where('notes', 'like', "%{$query}%")
                  ->orWhereHas('patient', function ($pq) use ($query) {
                      $pq->where('name', 'like', "%{$query}%");
                  });
            })
            ->limit(5)
            ->get()
            ->map(function ($rx) {
                return [
                  'id'          => $rx->id,
                  'title'       => "Prescription #RX-{$rx->id}",
                  'subtitle'    => "Patient: " . ($rx->patient->name ?? 'N/A') . " • Dr. " . ($rx->doctor->name ?? 'Doctor'),
                  'type'        => 'prescription',
                  'target_tab'  => 'prescription',
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'patients'      => $patients,
                'appointments'  => $appointments,
                'queue'         => $queueTokens,
                'invoices'      => $invoices,
                'prescriptions' => $prescriptions,
            ],
        ]);
    }
}
