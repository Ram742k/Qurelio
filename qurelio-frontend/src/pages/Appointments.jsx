import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Calendar,
  Clock,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
  CalendarDays,
  ClipboardList,
  PhoneCall,
  LayoutList,
  LayoutGrid,
  ListOrdered,
} from 'lucide-react';

// ─── Track View (Doctor × Time-slot grid) ────────────────────────────────────
const TRACK_COLORS = [
  { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  { bg: '#f3e8ff', color: '#6b21a8', border: '#c084fc' },
  { bg: '#ffe4e6', color: '#9f1239', border: '#fda4af' },
  { bg: '#e0f2fe', color: '#0c4a6e', border: '#7dd3fc' },
];

const TIME_SLOTS = [
  '08:00 AM','08:30 AM','09:00 AM','09:30 AM',
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','01:00 PM','01:30 PM',
  '02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM',
];

function parseSlot(scheduled_at) {
  const d = new Date(scheduled_at);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  const mStr = m < 30 ? '00' : '30';
  return `${String(h12).padStart(2,'0')}:${mStr} ${ampm}`;
}

function TrackView({ appointments, doctors, loading, onApptClick, openCreate }) {
  // Build unique doctor list from appointments + doctors prop
  const apptDoctors = [];
  const seen = new Set();
  appointments.forEach(a => {
    if (a.doctor && !seen.has(a.doctor.id)) {
      seen.add(a.doctor.id);
      apptDoctors.push(a.doctor);
    }
  });
  // Also add doctors with no appts today so their column shows
  doctors.forEach(d => {
    if (!seen.has(d.id)) { seen.add(d.id); apptDoctors.push(d); }
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '14px' }}>Loading track view...</p>
      </div>
    );
  }

  // Map: slotKey -> doctorId -> appointment
  const grid = {};
  TIME_SLOTS.forEach(slot => { grid[slot] = {}; });
  appointments.forEach(a => {
    const slot = parseSlot(a.scheduled_at);
    if (grid[slot] !== undefined && a.doctor?.id) {
      if (!grid[slot][a.doctor.id]) grid[slot][a.doctor.id] = [];
      grid[slot][a.doctor.id].push(a);
    }
  });

  const CELL_W  = Math.max(140, Math.floor(720 / Math.max(apptDoctors.length, 1)));
  const CELL_H  = 56;
  const TIME_W  = 80;

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Sticky Header — Doctor columns */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff' }}>
        {/* Time column header */}
        <div style={{ width: TIME_W, flexShrink: 0, padding: '14px 12px', borderRight: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time</p>
        </div>

        {apptDoctors.length === 0 ? (
          <div style={{ padding: '14px 20px', flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>No doctors found</p>
          </div>
        ) : (
          apptDoctors.map((doc, i) => (
            <div
              key={doc.id}
              style={{
                width: CELL_W, flexShrink: 0,
                padding: '12px 14px',
                borderRight: i < apptDoctors.length - 1 ? '1px solid #f1f5f9' : 'none',
                backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length].bg + '55',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length].bg,
                  border: `2px solid ${TRACK_COLORS[i % TRACK_COLORS.length].border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '800', fontSize: '12px', color: TRACK_COLORS[i % TRACK_COLORS.length].color,
                }}>
                  {doc.name?.substring(0, 2).toUpperCase() || 'DR'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Dr. {doc.name}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scrollable grid body */}
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
        {TIME_SLOTS.map((slot, si) => {
          const hasAny = apptDoctors.some(d => (grid[slot][d.id] || []).length > 0);
          return (
            <div
              key={slot}
              style={{
                display: 'flex',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: si % 2 === 0 ? '#fff' : '#fafafa',
                minHeight: CELL_H,
              }}
            >
              {/* Time label */}
              <div style={{
                width: TIME_W, flexShrink: 0,
                padding: '10px 12px',
                borderRight: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {slot}
                </span>
              </div>

              {/* Doctor cells */}
              {apptDoctors.map((doc, i) => {
                const appts = grid[slot][doc.id] || [];
                const color = TRACK_COLORS[i % TRACK_COLORS.length];
                return (
                  <div
                    key={doc.id}
                    style={{
                      width: CELL_W, flexShrink: 0,
                      padding: '6px 8px',
                      borderRight: i < apptDoctors.length - 1 ? '1px solid #f1f5f9' : 'none',
                      display: 'flex', flexDirection: 'column', gap: '4px',
                    }}
                  >
                    {appts.map(appt => (
                      <div
                        key={appt.id}
                        onClick={() => onApptClick(appt)}
                        style={{
                          backgroundColor: color.bg,
                          border: `1px solid ${color.border}`,
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          borderLeft: `3px solid ${color.color}`,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <p style={{ fontSize: '12px', fontWeight: '700', color: color.color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {appt.patient?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '10px', color: color.color + 'cc', marginTop: '2px', fontWeight: '500' }}>
                          {STATUS_CONFIG[appt.status]?.label || appt.status}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  booked:     { label: 'Booked',     bg: '#dbeafe', color: '#1d4ed8' },
  checked_in: { label: 'Checked In', bg: '#fef9c3', color: '#a16207' },
  completed:  { label: 'Completed',  bg: '#dcfce7', color: '#15803d' },
  no_show:    { label: 'No Show',    bg: '#f1f5f9', color: '#475569' },
  cancelled:  { label: 'Cancelled',  bg: '#fee2e2', color: '#dc2626' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: '700',
      padding: '3px 10px',
      borderRadius: '20px',
      backgroundColor: cfg.bg,
      color: cfg.color,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function toISOLocal(dateStr, timeStr) {
  // Returns a naive local datetime string: "2026-08-10T09:00:00"
  // Laravel (timezone=Asia/Kolkata) will interpret it as IST — correct.
  return `${dateStr}T${timeStr}:00`;
}

function formatDateTimeForDisplay(isoStr) {
  // Parse ISO string as local time (not UTC) when it has no Z/offset suffix.
  // If the backend returns a UTC ISO with Z, convert to IST for display.
  if (!isoStr) return null;
  return new Date(isoStr);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Appointments({ autoOpenCreate, onResetAutoOpen }) {
  // View mode: 'card' | 'track'
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('appt_view') || 'card'
  );

  function switchView(mode) {
    setViewMode(mode);
    localStorage.setItem('appt_view', mode);
  }

  // List state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Filter state
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Reference data
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    date: todayStr(),
    time: '09:00',
    status: 'booked',
  });

  // ─── Fetch appointments ────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterDoctor) params.doctor_id = filterDoctor;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/appointments', { params });
      const list = res.data?.data?.data || res.data?.data || [];
      let data = Array.isArray(list) ? list : [];

      // Client-side search filter (by patient name)
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(a =>
          a.patient?.name?.toLowerCase().includes(q) ||
          a.doctor?.name?.toLowerCase().includes(q)
        );
      }

      setAppointments(data);
      if (data.length > 0 && !selectedAppt) setSelectedAppt(data[0]);
    } catch (err) {
      setApiError('Failed to load appointments. Please try again.');
    }
    setLoading(false);
  }, [filterDate, filterDoctor, filterStatus, search]);

  // ─── Fetch doctors + patients for form ────────────────────────────────────
  const fetchReferenceData = useCallback(async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/patients', { params: { per_page: 200 } }),
      ]);
      setDoctors(docRes.data?.data || []);
      const patData = patRes.data?.data?.data || patRes.data?.data || [];
      setPatients(Array.isArray(patData) ? patData : []);
    } catch (err) {
      console.error('Failed to load reference data', err);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetchReferenceData(); }, [fetchReferenceData]);

  // Auto-open create modal if triggered from Quick Links
  useEffect(() => {
    if (autoOpenCreate) {
      openCreate();
      if (onResetAutoOpen) onResetAutoOpen();
    }
  }, [autoOpenCreate]);

  // ─── Date navigation ───────────────────────────────────────────────────────
  function shiftDate(days) {
    const d = new Date(filterDate);
    d.setDate(d.getDate() + days);
    setFilterDate(d.toISOString().split('T')[0]);
    setSelectedAppt(null);
  }

  // ─── Open modal ────────────────────────────────────────────────────────────
  function openCreate() {
    setModalMode('create');
    setForm({ patient_id: '', doctor_id: '', date: filterDate || todayStr(), time: '09:00', status: 'booked' });
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  }

  function openEdit(appt) {
    setModalMode('edit');
    const dt = new Date(appt.scheduled_at);
    setForm({
      patient_id: String(appt.patient_id),
      doctor_id: String(appt.doctor_id),
      date: dt.toISOString().split('T')[0],
      time: dt.toTimeString().slice(0, 5),
      status: appt.status,
      _id: appt.id,
    });
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  }

  // ─── Submit form ───────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const scheduled_at = toISOLocal(form.date, form.time);

    try {
      if (modalMode === 'create') {
        await api.post('/appointments', {
          patient_id: parseInt(form.patient_id),
          doctor_id: parseInt(form.doctor_id),
          scheduled_at,
          status: form.status,
        });
        setFormSuccess('Appointment booked successfully!');
      } else {
        await api.put(`/appointments/${form._id}`, {
          scheduled_at,
          status: form.status,
          doctor_id: parseInt(form.doctor_id),
        });
        setFormSuccess('Appointment updated successfully!');
      }
      setTimeout(() => {
        setShowModal(false);
        setSelectedAppt(null);
        fetchAppointments();
      }, 900);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setFormError(msg);
    }
    setSubmitting(false);
  }

  // ─── Cancel appointment ────────────────────────────────────────────────────
  async function handleCancel(appt) {
    if (!window.confirm(`Cancel appointment for ${appt.patient?.name}?`)) return;
    try {
      await api.delete(`/appointments/${appt.id}`);
      setSelectedAppt(null);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment.');
    }
  }

  // ─── Status update shortcut ────────────────────────────────────────────────
  async function handleStatusUpdate(appt, newStatus) {
    try {
      const res = await api.put(`/appointments/${appt.id}`, { status: newStatus });
      const updated = res.data?.data || res.data;
      setSelectedAppt(updated);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  }

  // ─── Add appointment to OPD queue ─────────────────────────────────────────
  async function handleAddToQueue(appt) {
    try {
      const res = await api.post('/queue/tokens', { appointment_id: appt.id });
      const token = res.data?.data?.token_number || '';
      alert(`✅ Added to queue! Token: ${token}`);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to queue.');
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)', backgroundColor: '#f8fafc' }}>

      {/* ── Left Filter Panel ── */}
      <div style={{
        width: '240px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        flexShrink: 0,
      }}>
        {/* Section: Calendar Date */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
            Appointments
          </h3>

          {/* Date Navigator */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #99f6e4',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <button
                onClick={() => shiftDate(-1)}
                style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f766e' }}>
                {new Date(filterDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
              <button
                onClick={() => shiftDate(1)}
                style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setSelectedAppt(null); }}
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #99f6e4', backgroundColor: '#fff' }}
            />
          </div>

          {/* Quick date links */}
          {[
            { label: 'Today', val: todayStr() },
            { label: 'Tomorrow', val: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() },
          ].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => { setFilterDate(val); setSelectedAppt(null); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: filterDate === val ? '700' : '500',
                color: filterDate === val ? '#0d9488' : '#475569',
                backgroundColor: filterDate === val ? '#f0fdf4' : 'transparent',
                borderLeft: filterDate === val ? '3px solid #0d9488' : '3px solid transparent',
                marginBottom: '4px',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Filter by Status
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { val: '', label: 'All Statuses' },
              ...Object.entries(STATUS_CONFIG).map(([val, c]) => ({ val, label: c.label })),
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: filterStatus === val ? '700' : '500',
                  color: filterStatus === val ? '#0d9488' : '#475569',
                  backgroundColor: filterStatus === val ? '#f0fdf4' : 'transparent',
                  borderLeft: filterStatus === val ? '3px solid #0d9488' : '3px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Filter */}
        {doctors.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Filter by Doctor
            </p>
            <select
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
              style={{ width: '100%', fontSize: '13px', padding: '8px 10px', borderRadius: '8px' }}
            >
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
            </select>
          </div>
        )}

        {/* Decorative card */}
        <div style={{
          marginTop: 'auto',
          padding: '16px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%)',
          border: '1px solid #99f6e4',
          textAlign: 'center',
        }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            backgroundColor: '#0d9488', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 8px',
          }}>
            <CalendarDays size={18} />
          </div>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#0f766e', lineHeight: 1.4 }}>
            Manage all your appointments from one place
          </p>
        </div>
      </div>

      {/* ── Center: Appointment List ── */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', minWidth: 0 }}>
        {/* Top Control Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
            <input
              type="text"
              placeholder="Search by patient or doctor name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '14px' }}
            />
          </div>

          {/* ── View Toggle ── */}
          <div style={{
            display: 'flex', height: '42px', borderRadius: '10px',
            border: '1px solid #e2e8f0', overflow: 'hidden',
            backgroundColor: '#fff', flexShrink: 0,
          }}>
            <button
              onClick={() => switchView('card')}
              title="Card view"
              style={{
                width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: viewMode === 'card' ? '#0d9488' : 'transparent',
                color: viewMode === 'card' ? '#fff' : '#94a3b8',
                borderRight: '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutList size={17} />
            </button>
            <button
              onClick={() => switchView('track')}
              title="Track view (Doctor × Time)"
              style={{
                width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: viewMode === 'track' ? '#0d9488' : 'transparent',
                color: viewMode === 'track' ? '#fff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutGrid size={17} />
            </button>
          </div>

          <button
            onClick={fetchAppointments}
            style={{ height: '42px', width: '42px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openCreate}
            style={{
              height: '42px', padding: '0 20px', borderRadius: '10px',
              backgroundColor: '#0d9488', color: '#ffffff',
              fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={18} />
            <span>New Appointment</span>
          </button>
        </div>

        {/* Summary bar */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={14} color="#0d9488" />
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            {new Date(filterDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          {!loading && (
            <span style={{ fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', backgroundColor: '#f0fdf4', color: '#0d9488' }}>
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* States */}
        {apiError ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #fee2e2', padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#dc2626', marginBottom: '8px' }}>Failed to load appointments</h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{apiError}</p>
            <button onClick={fetchAppointments} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '13px' }}>
              Retry
            </button>
          </div>

        ) : viewMode === 'track' ? (
          /* ── Track View ── */
          <TrackView
            appointments={appointments}
            doctors={doctors}
            loading={loading}
            onApptClick={appt => { setSelectedAppt(appt); }}
            openCreate={openCreate}
          />

        ) : loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px' }}>Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
            <ClipboardList size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '16px', color: '#334155', marginBottom: '8px' }}>No appointments found</h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
              No appointments scheduled for this date. Book a new one to get started.
            </p>
            <button onClick={openCreate} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> Book Appointment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map(appt => {
              const isSelected = selectedAppt?.id === appt.id;
              const initials = appt.patient?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT';
              return (
                <div
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className="animate-fade-in"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '50%',
                      backgroundColor: isSelected ? '#0d9488' : '#e0f2fe',
                      color: isSelected ? '#fff' : '#0284c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '15px', flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {appt.patient?.name || 'Unknown Patient'}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Dr. {appt.doctor?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <Clock size={13} color="#0d9488" />
                        {formatTime(appt.scheduled_at)}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {formatDate(appt.scheduled_at)}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right Detail Panel ── */}
      {selectedAppt && (
        <div
          className="animate-slide-in"
          style={{
            width: '360px',
            backgroundColor: '#fff',
            borderLeft: '1px solid #e2e8f0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 72px)',
            flexShrink: 0,
          }}
        >
          {/* Header card */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%',
                backgroundColor: '#0d9488', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '18px',
              }}>
                {selectedAppt.patient?.name?.substring(0, 2).toUpperCase() || 'PT'}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                  {selectedAppt.patient?.name || 'Unknown Patient'}
                </h3>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#2dd4bf' }}>
                  APT-{String(selectedAppt.id).padStart(4, '0')}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Date:</span>
                <p style={{ fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>{formatDate(selectedAppt.scheduled_at)}</p>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Time:</span>
                <p style={{ fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>{formatTime(selectedAppt.scheduled_at)}</p>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Doctor:</span>
                <p style={{ fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>Dr. {selectedAppt.doctor?.name || '—'}</p>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Status:</span>
                <p style={{ marginTop: '4px' }}><StatusBadge status={selectedAppt.status} /></p>
              </div>
            </div>
          </div>

          {/* Patient info */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Patient Info</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={13} /> Name</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedAppt.patient?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><PhoneCall size={13} /> Phone</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedAppt.patient?.phone || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Stethoscope size={13} /> Doctor</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Dr. {selectedAppt.doctor?.name || '—'}</span>
              </div>
            </div>
          </div>

          {/* Status update shortcuts */}
          {!['completed', 'cancelled'].includes(selectedAppt.status) && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Update Status
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                {/* Add to Queue — shown for booked/checked_in */}
                {['booked', 'checked_in'].includes(selectedAppt.status) && (
                  <button
                    onClick={() => handleAddToQueue(selectedAppt)}
                    style={{
                      padding: '10px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
                      color: '#fff', fontSize: '13px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
                    }}
                  >
                    <ListOrdered size={15} /> Add to OPD Queue
                  </button>
                )}

                {selectedAppt.status === 'booked' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedAppt, 'checked_in')}
                    style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#a16207', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  >
                    <CheckCircle2 size={15} /> Mark as Checked In
                  </button>
                )}
                {['booked', 'checked_in'].includes(selectedAppt.status) && (
                  <button
                    onClick={() => handleStatusUpdate(selectedAppt, 'completed')}
                    style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  >
                    <CheckCircle2 size={15} /> Mark as Completed
                  </button>
                )}
                {['booked', 'checked_in'].includes(selectedAppt.status) && (
                  <button
                    onClick={() => handleStatusUpdate(selectedAppt, 'no_show')}
                    style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  >
                    <AlertCircle size={15} /> Mark as No Show
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            {!['completed', 'cancelled'].includes(selectedAppt.status) && (
              <button
                onClick={() => openEdit(selectedAppt)}
                style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', boxShadow: '0 4px 12px rgba(13,148,136,0.2)' }}
              >
                <Calendar size={16} /> Edit Appointment
              </button>
            )}
            {!['cancelled', 'completed'].includes(selectedAppt.status) && (
              <button
                onClick={() => handleCancel(selectedAppt)}
                style={{ padding: '11px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #fee2e2', color: '#dc2626', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              >
                <X size={16} /> Cancel Appointment
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── New/Edit Appointment Modal ── */}
      {showModal && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, padding: '20px',
          }}
        >
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  {modalMode === 'create' ? 'Book New Appointment' : 'Edit Appointment'}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {modalMode === 'create' ? 'Fill in the details below to schedule an appointment.' : 'Update the appointment details.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

              {/* Error / Success */}
              {formError && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#dcfce7', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={16} color="#15803d" />
                  <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '600' }}>{formSuccess}</p>
                </div>
              )}

              {/* Patient */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Patient *
                </label>
                <select
                  required
                  value={form.patient_id}
                  onChange={e => setForm({ ...form, patient_id: e.target.value })}
                  disabled={modalMode === 'edit'}
                  style={{ width: '100%', opacity: modalMode === 'edit' ? 0.6 : 1 }}
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
                </select>
              </div>

              {/* Doctor */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Doctor *
                </label>
                <select
                  required
                  value={form.doctor_id}
                  onChange={e => setForm({ ...form, doctor_id: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">Select doctor...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
                </select>
                {doctors.length === 0 && (
                  <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                    ⚠ No doctors found. Ensure a user with the 'doctor' role exists for this clinic.
                  </p>
                )}
              </div>

              {/* Date + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                    <option key={val} value={val}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, height: '44px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!formSuccess}
                  style={{
                    flex: 1, height: '44px', borderRadius: '10px',
                    backgroundColor: submitting ? '#99f6e4' : '#0d9488',
                    color: '#fff', fontWeight: '600', fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {submitting
                    ? <><RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                    : modalMode === 'create' ? 'Book Appointment' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
