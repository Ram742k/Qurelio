<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->onDelete('set null');
            $table->json('vitals')->nullable(); // bp, pulse, temp, weight, height, spo2
            $table->text('chief_complaints')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('clinical_notes')->nullable();
            $table->foreignId('prescription_id')->nullable()->constrained('prescriptions')->onDelete('set null');
            $table->date('follow_up_date')->nullable();
            $table->string('status')->default('completed'); // in_progress, completed
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'patient_id']);
            $table->index(['tenant_id', 'doctor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};
