<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicine_master', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->onDelete('cascade');
            $table->string('brand_name');
            $table->string('generic_name');
            $table->string('strength')->nullable();
            $table->string('form')->default('Tablet'); // Tablet, Capsule, Syrup, Injection, Ointment, Drops
            $table->string('unit')->nullable(); // mg, ml, g, etc.
            $table->string('manufacturer')->nullable();
            $table->boolean('is_custom')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Indexes for ultra-fast autocomplete search
            $table->index(['tenant_id', 'is_active']);
            $table->index('brand_name');
            $table->index('generic_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicine_master');
    }
};
