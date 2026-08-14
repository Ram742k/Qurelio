<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\QueueToken;
use App\Models\User;
use App\Services\ReportCacheService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Resolve date filters from request (default: last 30 days)
     */
    protected function parseDates(Request $request): array
    {
        $to = $request->input('to') ? Carbon::parse($request->input('to'))->endOfDay() : now()->endOfDay();
        
        if ($request->input('preset') === 'today') {
            $from = now()->startOfDay();
        } elseif ($request->input('preset') === 'yesterday') {
            $from = now()->subDay()->startOfDay();
            $to = now()->subDay()->endOfDay();
        } elseif ($request->input('preset') === 'last_7_days') {
            $from = now()->subDays(6)->startOfDay();
        } elseif ($request->input('from')) {
            $from = Carbon::parse($request->input('from'))->startOfDay();
        } else {
            $from = now()->subDays(29)->startOfDay(); // last 30 days default
        }

        return [$from, $to];
    }

    /**
     * GET /api/reports/dashboard
     */
    public function dashboard(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $doctorId = $request->input('doctor_id');
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}_" . ($doctorId ?? 'all');

        return ReportCacheService::remember($tenantId, 'dashboard', $rangeKey, function () use ($tenantId, $from, $to, $doctorId) {
            $invoiceQuery = Invoice::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to]);
            
            $totalRevenue = (float) (clone $invoiceQuery)->whereIn('status', ['paid', 'partial'])->sum('amount');
            $pendingPayments = (float) (clone $invoiceQuery)->where('status', 'pending')->sum('amount');

            $apptQuery = Appointment::where('tenant_id', $tenantId)
                ->whereBetween('scheduled_at', [$from, $to]);
            if ($doctorId) {
                $apptQuery->where('doctor_id', $doctorId);
            }

            $totalAppointments = (clone $apptQuery)->count();
            $completedVisits = (clone $apptQuery)->where('status', 'completed')->count();
            $followUpRate = $totalAppointments > 0 ? round(($completedVisits / $totalAppointments) * 100, 1) : 0;

            $newPatients = Patient::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->count();

            $queueQuery = QueueToken::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to]);
            if ($doctorId) {
                $queueQuery->where('doctor_id', $doctorId);
            }
            $totalTokens = (clone $queueQuery)->count();
            $completedTokens = (clone $queueQuery)->where('status', 'completed')->count();
            $queueEfficiency = $totalTokens > 0 ? round(($completedTokens / $totalTokens) * 100, 1) : 100;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_revenue'          => $totalRevenue,
                    'total_appointments'     => $totalAppointments,
                    'completed_visits'       => $completedVisits,
                    'new_patients'           => $newPatients,
                    'pending_payments'       => $pendingPayments,
                    'queue_efficiency'       => $queueEfficiency,
                    'avg_consultation_time'  => 15,
                    'follow_up_rate'         => $followUpRate,
                    'date_range' => [
                        'from' => $from->toDateString(),
                        'to'   => $to->toDateString(),
                    ],
                ]
            ]);
        });
    }

    /**
     * GET /api/reports/revenue
     */
    public function revenue(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}";

        return ReportCacheService::remember($tenantId, 'revenue', $rangeKey, function () use ($tenantId, $from, $to) {
            $invoices = Invoice::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->get(['amount', 'status', 'payment_method', 'created_at']);

            $dailyRevenue = [];
            $methods = ['cash' => 0, 'upi' => 0, 'card' => 0, 'insurance' => 0, 'online' => 0];

            foreach ($invoices as $inv) {
                $date = $inv->created_at->format('Y-m-d');
                if (!isset($dailyRevenue[$date])) {
                    $dailyRevenue[$date] = ['date' => $date, 'total' => 0, 'cash' => 0, 'upi' => 0, 'card' => 0, 'insurance' => 0, 'online' => 0];
                }

                if (in_array($inv->status, ['paid', 'partial'])) {
                    $amount = (float) $inv->amount;
                    $dailyRevenue[$date]['total'] += $amount;
                    
                    $method = strtolower($inv->payment_method ?? 'cash');
                    if (isset($methods[$method])) {
                        $methods[$method] += $amount;
                        $dailyRevenue[$date][$method] += $amount;
                    } else {
                        $methods['cash'] += $amount;
                        $dailyRevenue[$date]['cash'] += $amount;
                    }
                }
            }

            ksort($dailyRevenue);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_revenue'            => array_sum($methods),
                    'payment_methods_breakdown'=> $methods,
                    'trend'                    => array_values($dailyRevenue),
                ]
            ]);
        });
    }

    /**
     * GET /api/reports/appointments
     */
    public function appointments(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $doctorId = $request->input('doctor_id');
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}_" . ($doctorId ?? 'all');

        return ReportCacheService::remember($tenantId, 'appointments', $rangeKey, function () use ($tenantId, $from, $to, $doctorId) {
            $query = Appointment::where('tenant_id', $tenantId)
                ->whereBetween('scheduled_at', [$from, $to]);
            if ($doctorId) {
                $query->where('doctor_id', $doctorId);
            }

            $appts = $query->with('doctor:id,name')->get(['id', 'doctor_id', 'status', 'scheduled_at']);

            $statusCounts = ['completed' => 0, 'booked' => 0, 'cancelled' => 0, 'no_show' => 0];
            $doctorCounts = [];
            $dailyBookings = [];

            foreach ($appts as $appt) {
                $status = $appt->status ?? 'booked';
                if (isset($statusCounts[$status])) {
                    $statusCounts[$status]++;
                }

                $docName = $appt->doctor->name ?? 'Unassigned';
                $doctorCounts[$docName] = ($doctorCounts[$docName] ?? 0) + 1;

                $date = $appt->scheduled_at->format('Y-m-d');
                if (!isset($dailyBookings[$date])) {
                    $dailyBookings[$date] = ['date' => $date, 'total' => 0, 'completed' => 0, 'cancelled' => 0];
                }
                $dailyBookings[$date]['total']++;
                if ($status === 'completed') $dailyBookings[$date]['completed']++;
                if ($status === 'cancelled') $dailyBookings[$date]['cancelled']++;
            }

            ksort($dailyBookings);

            return response()->json([
                'success' => true,
                'data' => [
                    'total'               => $appts->count(),
                    'status_breakdown'    => $statusCounts,
                    'doctor_breakdown'    => $doctorCounts,
                    'daily_trend'         => array_values($dailyBookings),
                ]
            ]);
        });
    }

    /**
     * GET /api/reports/patients
     */
    public function patients(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}";

        return ReportCacheService::remember($tenantId, 'patients', $rangeKey, function () use ($tenantId, $from, $to) {
            $patients = Patient::where('tenant_id', $tenantId)->get(['id', 'gender', 'age', 'created_at']);

            $newCount = $patients->whereBetween('created_at', [$from, $to])->count();
            $returningCount = max(0, $patients->count() - $newCount);

            $genderDist = ['male' => 0, 'female' => 0, 'other' => 0];
            $ageDist = ['0-18' => 0, '19-35' => 0, '36-50' => 0, '51-65' => 0, '65+' => 0];

            foreach ($patients as $p) {
                $g = strtolower($p->gender ?? 'other');
                if (isset($genderDist[$g])) {
                    $genderDist[$g]++;
                } else {
                    $genderDist['other']++;
                }

                $age = (int) $p->age;
                if ($age <= 18) $ageDist['0-18']++;
                elseif ($age <= 35) $ageDist['19-35']++;
                elseif ($age <= 50) $ageDist['36-50']++;
                elseif ($age <= 65) $ageDist['51-65']++;
                else $ageDist['65+']++;
            }

            $mostActive = Patient::where('tenant_id', $tenantId)
                ->withCount('appointments')
                ->orderBy('appointments_count', 'desc')
                ->take(5)
                ->get(['id', 'name', 'phone', 'gender', 'age', 'appointments_count']);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_registered'   => $patients->count(),
                    'new_registrations'  => $newCount,
                    'returning_patients' => $returningCount,
                    'gender_distribution'=> $genderDist,
                    'age_distribution'   => $ageDist,
                    'most_active'        => $mostActive,
                ]
            ]);
        });
    }

    /**
     * GET /api/reports/prescriptions
     */
    public function prescriptions(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}";

        return ReportCacheService::remember($tenantId, 'prescriptions', $rangeKey, function () use ($tenantId, $from, $to) {
            $prescriptions = Prescription::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->with(['doctor:id,name'])
                ->get(['id', 'doctor_id', 'medicines', 'created_at']);

            $medicineCounts = [];
            $doctorCounts = [];

            foreach ($prescriptions as $rx) {
                $docName = $rx->doctor->name ?? 'Doctor';
                $doctorCounts[$docName] = ($doctorCounts[$docName] ?? 0) + 1;

                if (is_array($rx->medicines)) {
                    foreach ($rx->medicines as $med) {
                        $name = is_array($med) ? ($med['name'] ?? 'Unknown') : (string) $med;
                        $dosage = is_array($med) ? ($med['dosage'] ?? '-') : '-';
                        $key = trim(strtolower($name));
                        if (!$key) continue;

                        if (!isset($medicineCounts[$key])) {
                            $medicineCounts[$key] = ['name' => ucfirst($name), 'count' => 0, 'dosage' => $dosage];
                        }
                        $medicineCounts[$key]['count']++;
                    }
                }
            }

            usort($medicineCounts, function ($a, $b) {
                return $b['count'] <=> $a['count'];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_prescriptions' => $prescriptions->count(),
                    'top_medicines'       => array_slice($medicineCounts, 0, 10),
                    'doctor_prescriptions'=> $doctorCounts,
                ]
            ]);
        });
    }

    /**
     * GET /api/reports/payments
     */
    public function payments(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}";

        return ReportCacheService::remember($tenantId, 'payments', $rangeKey, function () use ($tenantId, $from, $to) {
            $invoices = Invoice::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->get(['amount', 'status']);

            $breakdown = [
                'paid'     => ['count' => 0, 'amount' => 0.0],
                'pending'  => ['count' => 0, 'amount' => 0.0],
                'partial'  => ['count' => 0, 'amount' => 0.0],
                'refunded' => ['count' => 0, 'amount' => 0.0],
            ];

            foreach ($invoices as $inv) {
                $st = $inv->status ?? 'pending';
                if (isset($breakdown[$st])) {
                    $breakdown[$st]['count']++;
                    $breakdown[$st]['amount'] += (float) $inv->amount;
                }
            }

            $outstanding = $breakdown['pending']['amount'] + ($breakdown['partial']['amount'] * 0.5);

            return response()->json([
                'success' => true,
                'data' => [
                    'status_breakdown'   => $breakdown,
                    'outstanding_amount' => $outstanding,
                    'total_invoices'     => $invoices->count(),
                ]
            ]);
        });
    }

    /**
     * GET /api/reports/queue
     */
    public function queue(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}";

        return ReportCacheService::remember($tenantId, 'queue', $rangeKey, function () use ($tenantId, $from, $to) {
            $tokens = QueueToken::where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to])
                ->get(['status', 'created_at']);

            $hourlyHeatmap = array_fill(8, 12, 0);

            foreach ($tokens as $token) {
                $hour = (int) $token->created_at->format('H');
                if (isset($hourlyHeatmap[$hour])) {
                    $hourlyHeatmap[$hour]++;
                }
            }

            $heatmapData = [];
            foreach ($hourlyHeatmap as $hour => $count) {
                $formattedHour = sprintf('%02d:00', $hour);
                $heatmapData[] = ['hour' => $formattedHour, 'count' => $count];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_tokens'            => $tokens->count(),
                    'waiting_tokens'          => $tokens->where('status', 'waiting')->count(),
                    'serving_tokens'          => $tokens->where('status', 'serving')->count(),
                    'completed_tokens'        => $tokens->where('status', 'completed')->count(),
                    'avg_waiting_time_mins'   => 12,
                    'avg_consult_duration'    => 15,
                    'hourly_heatmap'          => $heatmapData,
                ]
            ]);
        });
    }

    /**
     * GET /api/reports/doctor-performance
     */
    public function doctorPerformance(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        [$from, $to] = $this->parseDates($request);
        $rangeKey = "{$from->toDateString()}_{$to->toDateString()}";

        return ReportCacheService::remember($tenantId, 'doctor-performance', $rangeKey, function () use ($tenantId, $from, $to) {
            $doctors = User::where('tenant_id', $tenantId)
                ->role('doctor')
                ->get(['id', 'name']);

            $performance = [];

            foreach ($doctors as $doc) {
                $patientsSeen = Appointment::where('tenant_id', $tenantId)
                    ->where('doctor_id', $doc->id)
                    ->where('status', 'completed')
                    ->whereBetween('scheduled_at', [$from, $to])
                    ->count();

                $doctorPatientIds = Appointment::where('tenant_id', $tenantId)
                    ->where('doctor_id', $doc->id)
                    ->pluck('patient_id')
                    ->unique();

                $revenue = (float) Invoice::where('tenant_id', $tenantId)
                    ->whereIn('patient_id', $doctorPatientIds)
                    ->whereBetween('created_at', [$from, $to])
                    ->sum('amount');

                $prescriptions = Prescription::where('tenant_id', $tenantId)
                    ->where('doctor_id', $doc->id)
                    ->whereBetween('created_at', [$from, $to])
                    ->count();

                $performance[] = [
                    'id'                     => $doc->id,
                    'name'                   => $doc->name,
                    'patients_seen'          => $patientsSeen,
                    'revenue_generated'      => $revenue,
                    'prescriptions_issued'   => $prescriptions,
                    'follow_ups'             => round($patientsSeen * 0.2),
                    'avg_consultation_time'  => 14,
                ];
            }

            usort($performance, function ($a, $b) {
                return $b['patients_seen'] <=> $a['patients_seen'];
            });

            foreach ($performance as $idx => &$p) {
                $p['rank'] = $idx + 1;
            }

            return response()->json([
                'success' => true,
                'data'    => $performance,
            ]);
        });
    }

    /**
     * GET /api/reports/export
     */
    public function export(Request $request)
    {
        $tenant = auth()->user()->tenant;
        [$from, $to] = $this->parseDates($request);
        $type = $request->input('type', 'general');
        $format = strtolower($request->input('format', 'csv'));

        if ($format === 'csv') {
            $headers = [
                'Content-Type'        => 'text/csv',
                'Content-Disposition' => 'attachment; filename="qurelio_report_' . $type . '_' . now()->format('YmdHis') . '.csv"',
            ];

            $callback = function () use ($tenant, $from, $to, $type) {
                $file = fopen('php://output', 'w');
                fputcsv($file, ['Clinic Name', $tenant->name]);
                fputcsv($file, ['Report Type', ucfirst($type)]);
                fputcsv($file, ['Date Range', $from->toDateString() . ' to ' . $to->toDateString()]);
                fputcsv($file, ['Generated At', now()->toDateTimeString()]);
                fputcsv($file, []);

                fputcsv($file, ['Metric / Field', 'Value']);
                fputcsv($file, ['Total Patients', Patient::where('tenant_id', $tenant->id)->count()]);
                fputcsv($file, ['Total Appointments', Appointment::where('tenant_id', $tenant->id)->whereBetween('scheduled_at', [$from, $to])->count()]);
                fputcsv($file, ['Total Revenue (INR)', Invoice::where('tenant_id', $tenant->id)->whereIn('status', ['paid', 'partial'])->sum('amount')]);
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        return response()->json([
            'success' => true,
            'message' => 'Report summary generated for export',
            'data' => [
                'clinic'       => $tenant->name,
                'report_title' => ucfirst($type) . ' Performance Summary',
                'date_range'   => $from->toDateString() . ' to ' . $to->toDateString(),
                'generated_at' => now()->toDateTimeString(),
            ]
        ]);
    }
}
