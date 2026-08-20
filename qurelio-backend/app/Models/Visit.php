<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Visit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'doctor_id',
        'appointment_id',
        'vitals',
        'chief_complaints',
        'diagnosis',
        'clinical_notes',
        'prescription_id',
        'follow_up_date',
        'status',
    ];

    protected $casts = [
        'vitals'         => 'array',
        'follow_up_date' => 'date',
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

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }
}
