<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(protected DashboardService $dashboard) {}

    /**
     * GET /api/dashboard/stats
     *
     * Returns stats + today's schedule in a single response.
     * Authenticated + tenant-scoped via auth user.
     */
    public function stats(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $stats    = $this->dashboard->getStats($tenantId);
        $schedule = $this->dashboard->getTodaySchedule($tenantId);

        return response()->json([
            'success' => true,
            'data'    => [
                'stats'          => $stats,
                'today_schedule' => $schedule,
                'date'           => today()->toDateString(),
                'tenant_name'    => $request->user()->tenant->name ?? 'Clinic',
                'user_name'      => $request->user()->name,
            ],
        ]);
    }
}
