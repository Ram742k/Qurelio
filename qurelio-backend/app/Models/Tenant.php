<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'subdomain',
        'practice_type',
        'subscription_status',
        'subscription_plan',
        'trial_ends_at',
        'phone',
        'email',
        'address',
        'city',
        'state',
        'country',
        'pincode',
        'timezone',
        'logo_url',
        'cover_image_url',
        'working_hours',
        'settings',
        'onboarding_completed',
    ];

    protected $casts = [
        'working_hours'        => 'array',
        'settings'             => 'array',
        'onboarding_completed' => 'boolean',
        'trial_ends_at'        => 'datetime',
    ];

    public static function defaultWorkingHours(): array
    {
        return [
            'monday'    => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
            'tuesday'   => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
            'wednesday' => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
            'thursday'  => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
            'friday'    => ['open' => true,  'start' => '09:00', 'end' => '18:00'],
            'saturday'  => ['open' => true,  'start' => '09:00', 'end' => '14:00'],
            'sunday'    => ['open' => false, 'start' => '09:00', 'end' => '18:00'],
        ];
    }

    public function setPracticeType(string $type): void
    {
        if (!in_array($type, ['clinic', 'hospital', 'dental'])) {
            throw new \InvalidArgumentException('Invalid practice type');
        }
        $this->practice_type = $type;
        $this->save();
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
