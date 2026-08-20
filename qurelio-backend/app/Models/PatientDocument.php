<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'user_id',
        'title',
        'category',
        'file_path',
        'file_name',
        'file_type',
        'file_size_kb',
        'notes',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
