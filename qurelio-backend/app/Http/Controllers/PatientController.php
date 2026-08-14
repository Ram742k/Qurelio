<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Services\DashboardService;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    // GET /api/patients?search=xxx
    public function index(Request $request)
    {
        $query = Patient::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $patients = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($patients);
    }

    // POST /api/patients
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'required|string|max:15',
            'medical_history' => 'nullable|array',
        ]);

        $patient = Patient::create($validated);

        // Invalidate dashboard cache so new_patients_today is up to date
        app(DashboardService::class)->invalidate(auth()->user()->tenant_id);

        return response()->json($patient, 201);
    }

    // GET /api/patients/{id}
    public function show(Patient $patient)
    {
        return response()->json($patient);
    }

    // PUT /api/patients/{id}
    public function update(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:120',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'sometimes|string|max:15',
            'medical_history' => 'nullable|array',
        ]);

        $patient->update($validated);

        return response()->json($patient);
    }

    // DELETE /api/patients/{id}
    public function destroy(Patient $patient)
    {
        $patient->delete();
        return response()->json(['message' => 'Patient deleted']);
    }
}
