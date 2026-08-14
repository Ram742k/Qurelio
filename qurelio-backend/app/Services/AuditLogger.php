<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    public static function log(string $action, string $description, ?Request $request = null): ?AuditLog
    {
        $user = auth()->user();
        if (!$user || !$user->tenant_id) {
            return null;
        }

        $request = $request ?? request();

        return AuditLog::create([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $user->id,
            'user_name'   => $user->name,
            'action'      => $action,
            'description' => $description,
            'ip_address'  => $request->ip(),
            'user_agent'  => substr($request->userAgent() ?? '', 0, 255),
        ]);
    }
}
