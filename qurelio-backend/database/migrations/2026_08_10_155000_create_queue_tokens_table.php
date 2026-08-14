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
        Schema::create('queue_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->string('token_number'); // e.g. "A-001"
            $table->enum('status', ['waiting', 'serving', 'done', 'skipped'])->default('waiting');
            $table->timestamps();

            // Index optimized for daily/doctor token counts and queries
            $table->index(['tenant_id', 'doctor_id', 'status']);
            $table->index(['tenant_id', 'appointment_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_tokens');
    }
};
