<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'trial_ends_at')) {
                $table->timestamp('trial_ends_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('tenants', 'trial_extended')) {
                $table->boolean('trial_extended')->default(false)->after('trial_ends_at');
            }
            if (!Schema::hasColumn('tenants', 'upgrade_nudges_sent')) {
                $table->json('upgrade_nudges_sent')->nullable()->after('trial_extended');
            }
            if (!Schema::hasColumn('tenants', 'plan')) {
                $table->string('plan')->default('trial')->after('upgrade_nudges_sent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['trial_ends_at', 'trial_extended', 'upgrade_nudges_sent', 'plan']);
        });
    }
};
