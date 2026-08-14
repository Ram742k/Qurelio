import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { generatePrescriptionPdf } from '../utils/pdfGenerator';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  User,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pill,
  Trash2,
  Download,
  Share2,
  Printer,
  ChevronLeft,
  MessageCircle,
  Eye,
  Edit,
  ArrowLeft,
  Sparkles,
  PhoneCall,
  Check,
} from 'lucide-react';

const FREQUENCY_PRESETS = [
  { val: '1-0-1', label: '1-0-1 (Morning & Night)' },
  { val: '1-1-1', label: '1-1-1 (Thrice daily)' },
  { val: '1-0-0', label: '1-0-0 (Morning only)' },
  { val: '0-1-0', label: '0-1-0 (Afternoon only)' },
  { val: '0-0-1', label: '0-0-1 (Night only)' },
  { val: '1-1-1-1', label: '1-1-1-1 (Four times daily)' },
  { val: 'As needed', label: 'As needed (PRN)' },
];

export default function Prescriptions({ initialView = 'list', initialPrescriptionId = null }) {
  const [view, setView] = useState(initialView); // 'list' | 'create' | 'edit' | 'view'
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Selected prescription for view/edit
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Dropdown reference data
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Form State
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_id: '',
    medicines: [
      { name: '', dosage: '', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' }
    ],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // PDF & WhatsApp action states
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [whatsappSharing, setWhatsappSharing] = useState(false);
  const [whatsappModalData, setWhatsappModalData] = useState(null);

  // ─── Fetch Prescriptions List ──────────────────────────────────────────────
  const fetchPrescriptions = useCallback(async (page = 1) => {
    setLoading(true);
    setApiError(null);
    try {
      const params = { page };
      if (search.trim()) params.search = search;
      if (filterPatient) params.patient_id = filterPatient;
      if (filterDoctor) params.doctor_id = filterDoctor;
      if (filterDate) params.date = filterDate;

      const res = await api.get('/prescriptions', { params });
      const paginatedData = res.data?.data;
      setPrescriptions(paginatedData?.data || []);
      setPagination({
        current_page: paginatedData?.current_page || 1,
        last_page: paginatedData?.last_page || 1,
        total: paginatedData?.total || 0,
      });
    } catch (err) {
      setApiError('Unable to load prescriptions. Please try again.');
    }
    setLoading(false);
  }, [search, filterPatient, filterDoctor, filterDate]);

  // ─── Fetch Patients, Doctors, Appointments ────────────────────────────────
  const fetchReferenceData = useCallback(async () => {
    try {
      const [patRes, docRes, apptRes] = await Promise.all([
        api.get('/patients', { params: { per_page: 200 } }),
        api.get('/doctors'),
        api.get('/appointments', { params: { per_page: 100 } }),
      ]);
      setPatients(patRes.data?.data?.data || patRes.data?.data || []);
      setDoctors(docRes.data?.data || []);
      setAppointments(apptRes.data?.data?.data || apptRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load reference data', err);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // ─── View Single Prescription Detail ───────────────────────────────────────
  const openView = async (idOrPrescription) => {
    if (typeof idOrPrescription === 'object') {
      setSelectedPrescription(idOrPrescription);
      setView('view');
      return;
    }
    setLoadingDetail(true);
    try {
      const res = await api.get(`/prescriptions/${idOrPrescription}`);
      setSelectedPrescription(res.data?.data);
      setView('view');
    } catch (err) {
      alert('Failed to load prescription details.');
    }
    setLoadingDetail(false);
  };

  // ─── Open Create Mode ──────────────────────────────────────────────────────
  const openCreate = (prefillData = null) => {
    setForm({
      patient_id: prefillData?.patient_id ? String(prefillData.patient_id) : '',
      doctor_id: prefillData?.doctor_id ? String(prefillData.doctor_id) : (doctors[0]?.id ? String(doctors[0].id) : ''),
      appointment_id: prefillData?.appointment_id ? String(prefillData.appointment_id) : '',
      medicines: [
        { name: '', dosage: '500mg', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' }
      ],
      notes: '',
    });
    setFormError(null);
    setFormSuccess(null);
    setView('create');
  };

  // ─── Open Edit Mode ────────────────────────────────────────────────────────
  const openEdit = (rx) => {
    setSelectedPrescription(rx);
    setForm({
      id: rx.id,
      patient_id: String(rx.patient_id),
      doctor_id: String(rx.doctor_id),
      appointment_id: rx.appointment_id ? String(rx.appointment_id) : '',
      medicines: Array.isArray(rx.medicines) && rx.medicines.length > 0
        ? rx.medicines.map(m => ({
            name: m.name || '',
            dosage: m.dosage || '',
            frequency: m.frequency || '1-0-1',
            duration: m.duration || '',
            instructions: m.instructions || '',
          }))
        : [{ name: '', dosage: '', frequency: '1-0-1', duration: '', instructions: '' }],
      notes: rx.notes || '',
    });
    setFormError(null);
    setFormSuccess(null);
    setView('edit');
  };

  // ─── Medicine Row Handlers ─────────────────────────────────────────────────
  const addMedicineRow = () => {
    setForm(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { name: '', dosage: '500mg', frequency: '1-0-1', duration: '5 Days', instructions: 'After food' }
      ]
    }));
  };

  const removeMedicineRow = (index) => {
    if (form.medicines.length === 1) {
      alert('A prescription must have at least one medicine.');
      return;
    }
    setForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicineField = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  // ─── Save Prescription (Submit API) ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!form.patient_id) {
      setFormError('Please select a patient.');
      return;
    }
    if (!form.doctor_id) {
      setFormError('Please select a doctor.');
      return;
    }
    if (!form.medicines || form.medicines.length === 0) {
      setFormError('At least one medicine is required.');
      return;
    }

    for (let i = 0; i < form.medicines.length; i++) {
      if (!form.medicines[i].name.trim()) {
        setFormError(`Medicine #${i + 1} requires a medicine name.`);
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      patient_id: parseInt(form.patient_id),
      doctor_id: parseInt(form.doctor_id),
      appointment_id: form.appointment_id ? parseInt(form.appointment_id) : null,
      medicines: form.medicines.map(m => ({
        name: m.name.trim(),
        dosage: m.dosage ? m.dosage.trim() : '',
        frequency: m.frequency ? m.frequency.trim() : '',
        duration: m.duration ? m.duration.trim() : '',
        instructions: m.instructions ? m.instructions.trim() : '',
      })),
      notes: form.notes ? form.notes.trim() : null,
    };

    try {
      let res;
      if (view === 'edit') {
        res = await api.put(`/prescriptions/${form.id}`, payload);
        setFormSuccess('Prescription updated successfully!');
      } else {
        res = await api.post('/prescriptions', payload);
        setFormSuccess('Prescription created successfully!');
      }

      const savedRx = res.data?.data;
      setTimeout(() => {
        setSelectedPrescription(savedRx);
        fetchPrescriptions();
        setView('view');
      }, 700);

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save prescription. Please check fields and try again.';
      setFormError(msg);
    }
    setSubmitting(false);
  };

  // ─── Delete Prescription ───────────────────────────────────────────────────
  const handleDelete = async (rx) => {
    if (!window.confirm(`Delete prescription #RX-${String(rx.id).padStart(6, '0')}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/prescriptions/${rx.id}`);
      fetchPrescriptions();
      if (view === 'view') setView('list');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete prescription.');
    }
  };

  // ─── Export PDF ────────────────────────────────────────────────────────────
  const handleGeneratePdf = (rx) => {
    setPdfGenerating(true);
    try {
      generatePrescriptionPdf(rx, false);
    } catch (err) {
      alert('Unable to generate PDF. Please try again.');
    }
    setPdfGenerating(false);
  };

  // ─── Share via WhatsApp ────────────────────────────────────────────────────
  const handleShareWhatsApp = async (rx) => {
    setWhatsappSharing(true);
    try {
      const res = await api.post(`/prescriptions/${rx.id}/share-whatsapp`);
      const data = res.data?.data;
      setWhatsappModalData(data);
      if (data?.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to share via WhatsApp.';
      alert(msg);
    }
    setWhatsappSharing(false);
  };

  // Helper formatters
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const rxIdFormatted = (id) => `#RX-${String(id).padStart(6, '0')}`;

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER: CREATE OR EDIT BUILDER VIEW
  // ───────────────────────────────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setView('list')}
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                backgroundColor: '#fff', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                {view === 'create' ? 'New Prescription Builder 💊' : `Edit Prescription ${rxIdFormatted(form.id)}`}
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Build structured medication orders with automatic PDF & WhatsApp compatibility.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setView('list')}
            style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: '600' }}
          >
            Cancel
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
          
          {/* Notifications */}
          {formError && (
            <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color="#dc2626" />
              <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>{formError}</p>
            </div>
          )}
          {formSuccess && (
            <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#dcfce7', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} color="#15803d" />
              <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '700' }}>{formSuccess}</p>
            </div>
          )}

          {/* Card 1: Patient & Doctor Context */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#0d9488" /> Consultation Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              
              {/* Patient Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Select Patient *
                </label>
                <select
                  required
                  value={form.patient_id}
                  onChange={e => setForm({ ...form, patient_id: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (PT-{p.id} — {p.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Prescribing Doctor *
                </label>
                <select
                  required
                  value={form.doctor_id}
                  onChange={e => setForm({ ...form, doctor_id: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name.startsWith('Dr') ? d.name : `Dr. ${d.name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Link (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Linked Visit / Appointment
                </label>
                <select
                  value={form.appointment_id}
                  onChange={e => setForm({ ...form, appointment_id: e.target.value })}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '13px', color: '#475569' }}
                >
                  <option value="">-- Direct Prescription (No Appt) --</option>
                  {appointments.map(a => (
                    <option key={a.id} value={a.id}>
                      APT-{String(a.id).padStart(4,'0')} ({a.patient?.name} — {formatDate(a.scheduled_at)})
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Card 2: Structured Medicine Builder */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={18} color="#0d9488" /> Prescribed Medications ({form.medicines.length})
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Add medication name, dosage, frequency, duration, and patient instructions.
                </p>
              </div>

              <button
                type="button"
                onClick={addMedicineRow}
                style={{
                  padding: '9px 16px', borderRadius: '10px',
                  backgroundColor: '#f0fdf4', border: '1px solid #99f6e4',
                  color: '#0d9488', fontSize: '13px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Plus size={16} /> Add Medicine
              </button>
            </div>

            {/* Medicine Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {form.medicines.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#0d9488', backgroundColor: '#ccfbf1', padding: '2px 8px', borderRadius: '6px' }}>
                      Medicine #{idx + 1}
                    </span>
                    {form.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(idx)}
                        style={{ color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 2fr', gap: '12px' }}>
                    
                    {/* Medicine Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Paracetamol 650mg"
                        value={med.name}
                        onChange={e => updateMedicineField(idx, 'name', e.target.value)}
                        style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                      />
                    </div>

                    {/* Dosage */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 650mg / 1 Tab"
                        value={med.dosage}
                        onChange={e => updateMedicineField(idx, 'dosage', e.target.value)}
                        style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                        Frequency
                      </label>
                      <select
                        value={med.frequency}
                        onChange={e => updateMedicineField(idx, 'frequency', e.target.value)}
                        style={{ width: '100%', height: '38px', padding: '0 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600', color: '#0d9488' }}
                      >
                        {FREQUENCY_PRESETS.map(p => (
                          <option key={p.val} value={p.val}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 Days"
                        value={med.duration}
                        onChange={e => updateMedicineField(idx, 'duration', e.target.value)}
                        style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    {/* Instructions */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                        Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. After food with warm water"
                        value={med.instructions}
                        onChange={e => updateMedicineField(idx, 'instructions', e.target.value)}
                        style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Clinical Notes */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Doctor Advice & Notes
            </h3>
            <textarea
              rows={3}
              placeholder="e.g. Review after 5 days. Drink plenty of water and rest..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.5' }}
            />
          </div>

          {/* Actions Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setView('list')}
              style={{ padding: '12px 24px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569', fontSize: '14px', fontWeight: '600' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 28px', borderRadius: '10px',
                backgroundColor: submitting ? '#99f6e4' : '#0d9488',
                color: '#fff', fontSize: '14px', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Saving Prescription...' : (view === 'create' ? 'Save & View Prescription' : 'Update Prescription')}
            </button>
          </div>

        </form>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER: PRESCRIPTION DETAILS VIEW
  // ───────────────────────────────────────────────────────────────────────────
  if (view === 'view' && selectedPrescription) {
    const rx = selectedPrescription;
    const docName = rx.doctor?.name ? (rx.doctor.name.startsWith('Dr') ? rx.doctor.name : `Dr. ${rx.doctor.name}`) : 'Dr. Physician';

    return (
      <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
        
        {/* Top bar navigation & action header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setView('list')}
              style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Prescription {rxIdFormatted(rx.id)}
                </h1>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                  Verified RX
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Prescribed on {formatDate(rx.created_at)} for {rx.patient?.name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => openEdit(rx)}
              style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit size={16} /> Edit
            </button>

            <button
              onClick={() => handleGeneratePdf(rx)}
              disabled={pdfGenerating}
              style={{
                padding: '10px 18px', borderRadius: '10px',
                backgroundColor: '#fff', border: '1px solid #0d9488',
                color: '#0d9488', fontSize: '13px', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <Download size={16} /> Export PDF
            </button>

            <button
              onClick={() => handleShareWhatsApp(rx)}
              disabled={whatsappSharing}
              style={{
                padding: '10px 18px', borderRadius: '10px',
                backgroundColor: '#16a34a', color: '#fff',
                fontSize: '13px', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
              }}
            >
              <MessageCircle size={16} /> Share WhatsApp
            </button>
          </div>
        </div>

        {/* Prescription Detail Document Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '36px', maxWidth: '900px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          
          {/* Header Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '2px solid #0d9488' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0d9488', letterSpacing: '-0.02em' }}>
                QURELIO HEALTH CLINIC
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                123 Healthcare Blvd, Suite 400 | Phone: +91 98400 00000
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{rxIdFormatted(rx.id)}</span>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Date: {formatDate(rx.created_at)}</p>
            </div>
          </div>

          {/* Patient & Doctor Context Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
            
            {/* Patient Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Info</p>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{rx.patient?.name || '—'}</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                MRN: <strong>PT-{rx.patient_id}</strong> | Age: <strong>{rx.patient?.age || '—'}</strong> | Gender: <strong>{rx.patient?.gender || '—'}</strong>
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Phone: <strong>{rx.patient?.phone || '—'}</strong>
              </p>
            </div>

            {/* Doctor Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescribing Doctor</p>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{docName}</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>MBBS, MD — Consultant Physician</p>
              {rx.appointment && (
                <p style={{ fontSize: '12px', color: '#0d9488', marginTop: '2px', fontWeight: '600' }}>
                  Linked Visit: APT-{String(rx.appointment.id).padStart(4, '0')}
                </p>
              )}
            </div>

          </div>

          {/* Rx Symbol */}
          <div style={{ padding: '20px 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: '800', color: '#0d9488', fontFamily: 'serif' }}>Rx</span>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Prescribed Medications</h3>
          </div>

          {/* Medicines Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0d9488', color: '#fff' }}>
                <th style={{ padding: '10px 14px', borderRadius: '8px 0 0 8px', fontWeight: '700' }}>#</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Medicine Name</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Dosage</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Frequency</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Duration</th>
                <th style={{ padding: '10px 14px', borderRadius: '0 8px 8px 0', fontWeight: '700' }}>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(rx.medicines) && rx.medicines.map((med, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0f172a' }}>{med.name}</td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{med.dosage || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      {med.frequency || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{med.duration || '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontStyle: 'italic' }}>{med.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Notes section */}
          {rx.notes && (
            <div style={{ backgroundColor: '#fef9c3', borderRadius: '12px', border: '1px solid #fde047', padding: '16px', marginBottom: '32px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#a16207', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Doctor Advice / Notes</p>
              <p style={{ fontSize: '13px', color: '#0f172a', marginTop: '4px', lineHeight: '1.5' }}>{rx.notes}</p>
            </div>
          )}

          {/* Signoff */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '32px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Doctor Signature</span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{docName}</p>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Authorized Medical Practitioner</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER: PRESCRIPTIONS LIST VIEW
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Patient Prescriptions 💊
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Manage patient medication records, export vector PDFs, and share directly via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => openCreate()}
          style={{
            height: '42px', padding: '0 20px', borderRadius: '10px',
            backgroundColor: '#0d9488', color: '#ffffff',
            fontSize: '14px', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            whiteSpace: 'nowrap', cursor: 'pointer',
          }}
        >
          <Plus size={18} /> New Prescription
        </button>
      </div>

      {/* Control / Filter Bar */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        
        {/* Search */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search by patient, doctor, or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: '38px', paddingLeft: '38px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
          />
        </div>

        {/* Patient Filter */}
        <select
          value={filterPatient}
          onChange={e => setFilterPatient(e.target.value)}
          style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="">All Patients</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Doctor Filter */}
        <select
          value={filterDoctor}
          onChange={e => setFilterDoctor(e.target.value)}
          style={{ height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', backgroundColor: '#fff' }}
        >
          <option value="">All Doctors</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
        />

        {(search || filterPatient || filterDoctor || filterDate) && (
          <button
            onClick={() => { setSearch(''); setFilterPatient(''); setFilterDoctor(''); setFilterDate(''); }}
            style={{ height: '38px', padding: '0 12px', borderRadius: '8px', backgroundColor: '#fee2e2', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: '600' }}
          >
            Clear Filters
          </button>
        )}

        <button
          onClick={() => fetchPrescriptions(pagination.current_page)}
          style={{ height: '38px', width: '38px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>

      </div>

      {/* Main Table Content */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px' }}>Loading prescriptions...</p>
        </div>
      ) : apiError ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #fee2e2', padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ color: '#dc2626', marginBottom: '8px' }}>Failed to load prescriptions</h4>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{apiError}</p>
          <button onClick={() => fetchPrescriptions(1)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '13px' }}>
            Retry
          </button>
        </div>
      ) : prescriptions.length === 0 ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
          <Pill size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '16px', color: '#334155', marginBottom: '6px' }}>No prescriptions found</h4>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
            Create a prescription to manage medication orders for your patients.
          </p>
          <button onClick={() => openCreate()} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '700', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> New Prescription
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>RX ID</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Patient</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Doctor</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Date</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Medicines</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx, idx) => {
                const meds = Array.isArray(rx.medicines) ? rx.medicines : [];
                const firstMed = meds[0]?.name || 'Medicines';
                const countRemaining = meds.length - 1;
                const docName = rx.doctor?.name ? (rx.doctor.name.startsWith('Dr') ? rx.doctor.name : `Dr. ${rx.doctor.name}`) : '—';

                return (
                  <tr key={rx.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '800', color: '#0d9488', fontSize: '14px' }}>
                      {rxIdFormatted(rx.id)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontWeight: '700', color: '#0f172a' }}>{rx.patient?.name || '—'}</p>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>MRN: PT-{rx.patient_id}</p>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569', fontWeight: '500' }}>
                      {docName}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                      {formatDate(rx.created_at)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Pill size={13} color="#0d9488" />
                        {firstMed} {countRemaining > 0 && <strong style={{ color: '#0d9488' }}>+{countRemaining} more</strong>}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        
                        <button
                          onClick={() => openView(rx)}
                          style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#f0fdf4', border: '1px solid #99f6e4', color: '#0d9488', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title="View prescription details"
                        >
                          <Eye size={13} /> View
                        </button>

                        <button
                          onClick={() => handleGeneratePdf(rx)}
                          style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title="Export PDF"
                        >
                          <Download size={13} /> PDF
                        </button>

                        <button
                          onClick={() => handleShareWhatsApp(rx)}
                          style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#16a34a', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          title="Share on WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Animation spinner style */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
