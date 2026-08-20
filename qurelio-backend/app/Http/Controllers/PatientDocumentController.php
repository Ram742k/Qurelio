<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PatientDocumentController extends Controller
{
    /**
     * GET /api/patients/{patient}/documents
     * Fetch all uploaded EMR files for a patient.
     */
    public function index(Request $request, Patient $patient)
    {
        $tenantId = $request->user()->tenant_id;

        if ($patient->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $documents = PatientDocument::where('tenant_id', $tenantId)
            ->where('patient_id', $patient->id)
            ->with('uploader:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $documents,
        ]);
    }

    /**
     * POST /api/patients/{patient}/documents
     * Upload an EMR document (lab report, x-ray, PDF, clinical note).
     */
    public function store(Request $request, Patient $patient)
    {
        $tenantId = $request->user()->tenant_id;

        if ($patient->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'title'    => 'required|string|max:150',
            'category' => 'required|string|in:lab_report,x_ray,pdf,prescription,clinical_note',
            'file'     => 'required|file|mimes:pdf,jpg,jpeg,png,dicom,doc,docx|max:10240', // 10MB max
            'notes'    => 'nullable|string|max:500',
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
        $path = $file->storeAs("tenants/{$tenantId}/patients/{$patient->id}", $fileName, 'public');

        $doc = PatientDocument::create([
            'tenant_id'    => $tenantId,
            'patient_id'   => $patient->id,
            'user_id'      => $request->user()->id,
            'title'        => $validated['title'],
            'category'     => $validated['category'],
            'file_path'    => '/storage/' . $path,
            'file_name'    => $file->getClientOriginalName(),
            'file_type'    => $file->getClientOriginalExtension(),
            'file_size_kb' => round($file->getSize() / 1024),
            'notes'        => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully.',
            'data'    => $doc->load('uploader:id,name'),
        ], 201);
    }

    /**
     * DELETE /api/documents/{document}
     */
    public function destroy(Request $request, PatientDocument $document)
    {
        if ($document->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted.',
        ]);
    }
}
