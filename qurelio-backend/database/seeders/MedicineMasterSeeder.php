<?php

namespace Database\Seeders;

use App\Models\MedicineMaster;
use Illuminate\Database\Seeder;

class MedicineMasterSeeder extends Seeder
{
    public function run(): void
    {
        $medicines = [
            [
                'brand_name'   => 'Dolo',
                'generic_name' => 'Paracetamol',
                'strength'     => '650 mg',
                'form'         => 'Tablet',
                'unit'         => 'mg',
                'manufacturer' => 'Micro Labs',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Azithral',
                'generic_name' => 'Azithromycin',
                'strength'     => '500 mg',
                'form'         => 'Tablet',
                'unit'         => 'mg',
                'manufacturer' => 'Alembic',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Pan',
                'generic_name' => 'Pantoprazole',
                'strength'     => '40 mg',
                'form'         => 'Tablet',
                'unit'         => 'mg',
                'manufacturer' => 'Alkem Labs',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Calpol',
                'generic_name' => 'Paracetamol',
                'strength'     => '500 mg',
                'form'         => 'Tablet',
                'unit'         => 'mg',
                'manufacturer' => 'GSK',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Moxikind-CV',
                'generic_name' => 'Amoxicillin + Clavulanic Acid',
                'strength'     => '625 mg',
                'form'         => 'Tablet',
                'unit'         => 'mg',
                'manufacturer' => 'Mankind',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Amoxycillin',
                'generic_name' => 'Amoxicillin',
                'strength'     => '500 mg',
                'form'         => 'Capsule',
                'unit'         => 'mg',
                'manufacturer' => 'Cipla',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Cetzine',
                'generic_name' => 'Cetirizine',
                'strength'     => '10 mg',
                'form'         => 'Tablet',
                'unit'         => 'mg',
                'manufacturer' => 'Dr Reddy',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Electral ORS',
                'generic_name' => 'Oral Rehydration Salts',
                'strength'     => '21.8 g',
                'form'         => 'Sachet',
                'unit'         => 'g',
                'manufacturer' => 'FDC',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Zinconia Syrup',
                'generic_name' => 'Zinc Acetate',
                'strength'     => '20 mg/5ml',
                'form'         => 'Syrup',
                'unit'         => 'ml',
                'manufacturer' => 'FDC',
                'is_custom'    => false,
                'is_active'    => true,
            ],
            [
                'brand_name'   => 'Uprise-D3',
                'generic_name' => 'Cholecalciferol (Vitamin D3)',
                'strength'     => '60000 IU',
                'form'         => 'Capsule',
                'unit'         => 'IU',
                'manufacturer' => 'Alkem Labs',
                'is_custom'    => false,
                'is_active'    => true,
            ],
        ];

        foreach ($medicines as $med) {
            MedicineMaster::firstOrCreate(
                ['brand_name' => $med['brand_name'], 'strength' => $med['strength']],
                $med
            );
        }
    }
}
