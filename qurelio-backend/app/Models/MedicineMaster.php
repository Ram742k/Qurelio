<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicineMaster extends Model
{
    protected $table = 'medicine_master';

    protected $fillable = [
        'tenant_id',
        'brand_name',
        'generic_name',
        'strength',
        'form',
        'unit',
        'manufacturer',
        'is_custom',
        'is_active',
    ];

    protected $casts = [
        'is_custom' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
