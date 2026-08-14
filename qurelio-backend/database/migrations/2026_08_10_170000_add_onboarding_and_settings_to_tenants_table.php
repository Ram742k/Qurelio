<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('name');
            $table->string('email')->nullable()->after('phone');
            $table->text('address')->nullable()->after('email');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('country')->default('India')->after('state');
            $table->string('pincode')->nullable()->after('country');
            $table->string('timezone')->default('Asia/Kolkata')->after('pincode');
            $table->string('logo_url')->nullable()->after('timezone');
            $table->json('working_hours')->nullable()->after('logo_url');
            $table->boolean('onboarding_completed')->default(false)->after('working_hours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'email',
                'address',
                'city',
                'state',
                'country',
                'pincode',
                'timezone',
                'logo_url',
                'working_hours',
                'onboarding_completed',
            ]);
        });
    }
};
