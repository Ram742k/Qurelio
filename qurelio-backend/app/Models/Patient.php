<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use BelongsToTenant;

    protected $fillable = ['tenant_id', 'name', 'age', 'gender', 'phone', 'medical_history'];

    protected $casts = [
        'medical_history' => 'array',
    ];

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }
}
