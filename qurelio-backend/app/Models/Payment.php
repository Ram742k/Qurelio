<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'invoice_id',
        'amount',
        'gateway',
        'gateway_order_id',
        'gateway_payment_id',
        'gateway_reference',
        'gateway_status',
        'gateway_response',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'amount'           => 'float',
        'gateway_response' => 'array',
        'paid_at'          => 'datetime',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}

