<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class QueueToken extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'doctor_id',
        'appointment_id',
        'token_number',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient()
    {
        return $this->hasOneThrough(
            Patient::class,
            Appointment::class,
            'id', // Foreign key on appointments table...
            'id', // Foreign key on patients table...
            'appointment_id', // Local key on queue_tokens table...
            'patient_id'      // Local key on appointments table...
        );
    }
}
