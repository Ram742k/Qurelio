<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'invoice_number',
        'amount',
        'status',
        'payment_method',
        'razorpay_order_id',
        'razorpay_payment_id',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}

