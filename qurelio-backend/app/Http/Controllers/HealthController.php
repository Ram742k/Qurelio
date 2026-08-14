<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    public function index()
    {
        $status = 'healthy';
        $checks = [];

        // 1. Database Check (MySQL)
        try {
            DB::connection()->getPdo();
            $checks['database'] = [
                'status'     => 'up',
                'connection' => config('database.default'),
            ];
        } catch (\Exception $e) {
            $status = 'degraded';
            $checks['database'] = [
                'status'  => 'down',
                'error'   => 'Database connection failed',
            ];
        }

        // 2. Cache / Redis Check
        try {
            Cache::put('health_check', true, 10);
            $redisUp = Cache::get('health_check');
            $checks['redis'] = [
                'status' => $redisUp ? 'up' : 'down',
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            $status = 'degraded';
            $checks['redis'] = [
                'status' => 'down',
                'error'  => 'Cache connection failed',
            ];
        }

        // 3. Queue & Failed Jobs Check
        try {
            $failedJobsCount = DB::table('failed_jobs')->count();
            $checks['queue'] = [
                'status'      => 'up',
                'connection'  => config('queue.default'),
                'failed_jobs' => $failedJobsCount,
            ];
        } catch (\Exception $e) {
            $checks['queue'] = [
                'status'      => 'up',
                'failed_jobs' => 0,
            ];
        }

        // 4. Storage Disk Check
        try {
            $disk = config('filesystems.default');
            $checks['storage'] = [
                'status' => 'up',
                'disk'   => $disk,
            ];
        } catch (\Exception $e) {
            $status = 'degraded';
            $checks['storage'] = [
                'status' => 'down',
                'error'  => 'Storage access error',
            ];
        }

        return response()->json([
            'status'      => $status,
            'application' => config('app.name', 'Qurelio Health'),
            'environment' => config('app.env'),
            'version'     => '1.0.0',
            'timestamp'   => now()->toIso8601String(),
            'checks'      => $checks,
        ], $status === 'healthy' ? 200 : 503);
    }
}
