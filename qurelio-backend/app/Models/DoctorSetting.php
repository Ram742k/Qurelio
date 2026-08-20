<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DoctorSetting extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'consultation_fee',
        'slot_duration_minutes',
        'specialization',
        'room_number',
    ];

    protected $casts = [
        'consultation_fee'      => 'decimal:2',
        'slot_duration_minutes' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
