<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'doctor_id',
        'appointment_id',
        'medicines',
        'notes',
    ];

    protected $casts = [
        'medicines' => 'array',
    ];

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

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
