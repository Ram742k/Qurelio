<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $tenant = Tenant::create([
            'name' => 'Sunrise Clinic',
            'subdomain' => 'sunrise-clinic',
            'practice_type' => 'clinic',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        $admin = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Ram Admin',
            'email'     => 'admin@sunrise.test',
            'phone'     => '9840000000',
            'password'  => bcrypt('password'),
            'status'    => 'active',
        ]);
        $admin->assignRole('clinic_admin');

        // Seed a doctor user for the same tenant
        $doctor = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Dr. Arun Kumar',
            'email'     => 'arun.doctor@sunrise.clinic',
            'phone'     => '9840000001',
            'password'  => bcrypt('password'),
            'status'    => 'active',
        ]);
        $doctor->assignRole('doctor');
    }
}
