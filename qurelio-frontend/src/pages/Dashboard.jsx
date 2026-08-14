import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  UserPlus,
  CalendarPlus,
  FileText,
  CreditCard,
  ArrowRight,
  Stethoscope,
  Activity,
  ClipboardList,
} from 'lucide-react';

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  booked:     { label: 'Upcoming',      bg: '#dbeafe', color: '#1d4ed8' },
  checked_in: { label: 'In Clinic',     bg: '#fef9c3', color: '#a16207' },
  completed:  { label: 'Completed',     bg: '#dcfce7', color: '#15803d' },
  no_show:    { label: 'No Show',       bg: '#f1f5f9', color: '#475569' },
  cancelled:  { label: 'Cancelled',     bg: '#fee2e2', color: '#dc2626' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-block', fontSize: '11px', fontWeight: '700',
      padding: '3px 10px', borderRadius: '20px',
      backgroundColor: cfg.bg, color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
      <div style={{ height: '12px', width: '60%', backgroundColor: '#f1f5f9', borderRadius: '6px', marginBottom: '16px' }} />
      <div style={{ height: '32px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '10px' }} />
      <div style={{ height: '10px', width: '50%', backgroundColor: '#f8fafc', borderRadius: '6px' }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, sublabel, value, accent, loading }) {
  if (loading) return <SkeletonCard />;
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '16px',
      border: '1px solid #e2e8f0', padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            {label}
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>{sublabel}</p>
        </div>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          backgroundColor: `${accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={accent} />
        </div>
      </div>
      <p style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ setActiveTab }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data?.data || null);
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const stats    = data?.stats || {};
  const schedule = data?.today_schedule || [];
  const userName = data?.user_name || 'Doctor';

  // ─── Greeting ─────────────────────────────────────────────────────────────
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ─── Error State ──────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #fee2e2', padding: '48px', maxWidth: '480px', margin: '0 auto' }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Dashboard Unavailable</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={fetchDashboard}
            style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {greeting}, {loading ? '...' : userName.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Here's what's happening in your clinic today.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          style={{ height: '38px', width: '38px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Refresh dashboard"
        >
          <RefreshCw size={16} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          loading={loading}
          icon={Calendar}
          label="Appointments"
          sublabel="Today"
          value={stats.appointments_today ?? 0}
          accent="#0d9488"
        />
        <StatCard
          loading={loading}
          icon={Clock}
          label="Waiting"
          sublabel="In Queue"
          value={stats.waiting_today ?? 0}
          accent="#f59e0b"
        />
        <StatCard
          loading={loading}
          icon={CheckCircle2}
          label="Completed"
          sublabel="Today"
          value={stats.completed_today ?? 0}
          accent="#10b981"
        />
        <StatCard
          loading={loading}
          icon={Users}
          label="New Patients"
          sublabel="Registered Today"
          value={stats.new_patients_today ?? 0}
          accent="#6366f1"
        />
      </div>

      {/* ── Main Content: Schedule + Right Cards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* ── Today's Schedule ─────────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Card Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={16} color="#0d9488" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Today's Schedule</h3>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab && setActiveTab('appointments')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#0d9488', padding: '6px 12px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #99f6e4' }}
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          {/* Schedule List */}
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: '60px', height: '34px', backgroundColor: '#f1f5f9', borderRadius: '8px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '12px', width: '55%', backgroundColor: '#f1f5f9', borderRadius: '6px', marginBottom: '8px' }} />
                    <div style={{ height: '10px', width: '35%', backgroundColor: '#f8fafc', borderRadius: '6px' }} />
                  </div>
                  <div style={{ width: '70px', height: '22px', backgroundColor: '#f1f5f9', borderRadius: '12px' }} />
                </div>
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Calendar size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>No appointments today</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Nothing scheduled yet. Book a new appointment to get started.</p>
              <button
                onClick={() => setActiveTab && setActiveTab('appointments')}
                style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CalendarPlus size={14} /> Book Appointment
              </button>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 100px', gap: '16px', padding: '10px 24px', borderBottom: '1px solid #f1f5f9' }}>
                {['Time', 'Patient', 'Doctor', 'Status'].map(h => (
                  <p key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
                ))}
              </div>

              {schedule.map((appt, idx) => (
                <div
                  key={appt.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 140px 100px', gap: '16px',
                    padding: '14px 24px', alignItems: 'center',
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa',
                    borderBottom: '1px solid #f8fafc',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafafa'}
                >
                  {/* Time */}
                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '6px 10px', textAlign: 'center', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0d9488', lineHeight: 1 }}>
                      {appt.time.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#0f766e' }}>
                      {appt.time.split(' ')[1]}
                    </span>
                  </div>

                  {/* Patient */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      backgroundColor: '#e0f2fe', color: '#0284c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', fontSize: '12px', flexShrink: 0,
                    }}>
                      {appt.patient?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT'}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                        {appt.patient?.name || 'Unknown'}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>{appt.type}</p>
                    </div>
                  </div>

                  {/* Doctor */}
                  <p style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                    Dr. {appt.doctor?.name || '—'}
                  </p>

                  {/* Status */}
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Side Cards ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quick Actions */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} color="#0d9488" /> Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { icon: UserPlus, label: 'Add Patient', tab: 'patients', bg: '#f0fdf4', color: '#0d9488', border: '#99f6e4' },
                { icon: CalendarPlus, label: 'New Appointment', tab: 'appointments', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
                { icon: FileText, label: 'Prescription', tab: 'prescription', bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
                { icon: CreditCard, label: 'Billing', tab: 'billing', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
              ].map(({ icon: Icon, label, tab, bg, color, border }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab && setActiveTab(tab)}
                  style={{
                    padding: '12px 10px', borderRadius: '12px',
                    backgroundColor: bg, border: `1px solid ${border}`,
                    color, fontSize: '12px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    justifyContent: 'center', flexDirection: 'column',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* New Patients Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={14} color="#6366f1" /> New Patients
              </h3>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</span>
            </div>
            {loading ? (
              <div style={{ height: '48px', backgroundColor: '#f1f5f9', borderRadius: '10px' }} />
            ) : stats.new_patients_today === 0 ? (
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>No new patients today</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#f5f3ff', borderRadius: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{stats.new_patients_today}</span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    {stats.new_patients_today} new patient{stats.new_patients_today !== 1 ? 's' : ''}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6366f1', fontWeight: '500' }}>registered today</p>
                </div>
              </div>
            )}
          </div>

          {/* Pending Payments Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={14} color="#f59e0b" /> Pending Payments
              </h3>
            </div>
            {loading ? (
              <div style={{ height: '48px', backgroundColor: '#f1f5f9', borderRadius: '10px' }} />
            ) : (
              <div style={{ padding: '16px', backgroundColor: '#fef9c3', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <p style={{ fontSize: '11px', color: '#92400e', fontWeight: '600', marginBottom: '6px' }}>
                  Billing module not yet active
                </p>
                <p style={{ fontSize: '12px', color: '#78350f' }}>
                  Payment tracking will be available once the billing module is enabled.
                </p>
              </div>
            )}
          </div>

          {/* Clinic Summary */}
          {!loading && data?.tenant_name && (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '16px', padding: '20px', color: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{data.tenant_name}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>Clinic Dashboard</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Today\'s Appts', val: stats.appointments_today ?? 0 },
                  { label: 'Completed',      val: stats.completed_today ?? 0 },
                  { label: 'Waiting',        val: stats.waiting_today ?? 0 },
                  { label: 'New Patients',   val: stats.new_patients_today ?? 0 },
                ].map(({ label, val }) => (
                  <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ fontSize: '20px', fontWeight: '800', color: '#fff', lineHeight: 1, marginTop: '4px' }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
