<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'patient_id', 'doctor_id', 'scheduled_at', 'status'];

    protected $casts = ['scheduled_at' => 'datetime'];

    // Active statuses that block a slot
    const BLOCKING_STATUSES = ['booked', 'checked_in'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}

