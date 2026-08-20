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
  Sparkles,
  Play,
  Check,
  ChevronRight,
  Zap,
  PhoneCall,
} from 'lucide-react';
import TrialBanner from '../components/common/TrialBanner';
import UpgradeModal from '../components/common/UpgradeModal';

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  booked:     { label: 'Upcoming',      bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  checked_in: { label: 'In Clinic',     bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
  completed:  { label: 'Completed',     bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  no_show:    { label: 'No Show',       bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  cancelled:  { label: 'Cancelled',     bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '11px',
      fontWeight: '700',
      padding: '4px 10px',
      borderRadius: '20px',
      backgroundColor: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
      <div style={{ height: '12px', width: '60%', backgroundColor: '#f1f5f9', borderRadius: '6px', marginBottom: '16px' }} />
      <div style={{ height: '32px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '10px' }} />
      <div style={{ height: '10px', width: '50%', backgroundColor: '#f8fafc', borderRadius: '6px' }} />
    </div>
  );
}

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, sublabel, value, accent, bgGradient, badgeText, loading }) {
  if (loading) return <SkeletonCard />;
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        padding: '22px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Background Accent Pill */}
      <div style={{
        position: 'absolute',
        top: '-15px',
        right: '-15px',
        width: '90px',
        height: '90px',
        borderRadius: '50%',
        background: bgGradient || `${accent}10`,
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: `${accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={22} color={accent} />
          </div>

          {badgeText && (
            <span style={{
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: accent,
              backgroundColor: `${accent}15`,
              padding: '3px 8px',
              borderRadius: '12px',
            }}>
              {badgeText}
            </span>
          )}
        </div>

        <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>
          {label}
        </p>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>{sublabel}</p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ setActiveTab }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [callingNext, setCallingNext] = useState(false);

  const tenant = localStorage.getItem('tenant') ? JSON.parse(localStorage.getItem('tenant')) : null;

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

  const handleCallNextQueue = async () => {
    try {
      setCallingNext(true);
      const res = await api.post('/queue/next', { doctor_id: data?.user_id });
      if (res.data?.success) {
        fetchDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'No patients currently waiting in queue.');
    } finally {
      setCallingNext(false);
    }
  };

  const stats    = data?.stats || {};
  const schedule = data?.today_schedule || [];
  const userName = data?.user_name || 'Doctor';

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #fee2e2', padding: '48px', maxWidth: '480px', margin: '0 auto' }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Dashboard Unavailable</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={fetchDashboard}
            style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
      {/* ── Persistent Trial Countdown Banner ───────────────────────────────── */}
      <TrialBanner tenant={tenant} onOpenUpgrade={() => setShowUpgradeModal(true)} />

      {/* ── Page Title Header Bar ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Dashboard Overview</span>
            <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#ccfbf1', color: '#0d9488', padding: '2px 8px', borderRadius: '12px' }}>Live OPD</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Welcome back, {userName}! Here is your clinic schedule & patient queue for today.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          style={{ height: '38px', padding: '0 16px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          title="Refresh dashboard data"
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── 4 Stat Cards Grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          loading={loading}
          icon={Calendar}
          label="Today's Appts"
          sublabel="Scheduled Bookings"
          value={stats.appointments_today ?? 0}
          accent="#0d9488"
          bgGradient="radial-gradient(circle, rgba(13,148,136,0.15) 0%, rgba(255,255,255,0) 70%)"
          badgeText="Today"
        />
        <StatCard
          loading={loading}
          icon={Clock}
          label="Waiting In OPD"
          sublabel="Live Patients Waiting"
          value={stats.waiting_today ?? 0}
          accent="#d97706"
          bgGradient="radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(255,255,255,0) 70%)"
          badgeText="Queue"
        />
        <StatCard
          loading={loading}
          icon={CheckCircle2}
          label="Completed"
          sublabel="Finished Consultations"
          value={stats.completed_today ?? 0}
          accent="#10b981"
          bgGradient="radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(255,255,255,0) 70%)"
          badgeText="Done"
        />
        <StatCard
          loading={loading}
          icon={Users}
          label="New Patients"
          sublabel="Registered Today"
          value={stats.new_patients_today ?? 0}
          accent="#6366f1"
          bgGradient="radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)"
          badgeText="New"
        />
      </div>

      {/* ── Main Content Grid (Schedule Table + Right Side Widgets) ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

        {/* ── Left Side: Today's OPD Schedule ──────────────────────────────── */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          {/* Card Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Today's OPD Schedule</h3>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab && setActiveTab('appointments')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#0d9488', padding: '7px 14px', borderRadius: '10px', backgroundColor: '#ccfbf1', border: 'none', cursor: 'pointer' }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
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
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '18px', backgroundColor: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Calendar size={28} />
              </div>
              <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>No Appointments Today</p>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>There are no scheduled OPD visits for today yet.</p>
              <button
                onClick={() => setActiveTab && setActiveTab('appointments')}
                style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(13,148,136,0.2)' }}
              >
                <CalendarPlus size={16} /> Book New Appointment
              </button>
            </div>
          ) : (
            <div>
              {/* Header Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 110px 90px', gap: '12px', padding: '12px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                {['Time', 'Patient Details', 'Doctor', 'Status', 'Action'].map(h => (
                  <p key={h} style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{h}</p>
                ))}
              </div>

              {schedule.map((appt, idx) => (
                <div
                  key={appt.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 140px 110px 90px', gap: '12px',
                    padding: '16px 24px', alignItems: 'center',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                >
                  {/* Time Badge */}
                  <div style={{ backgroundColor: '#ccfbf1', borderRadius: '10px', padding: '6px 10px', textAlign: 'center', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: 'fit-content' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0d9488', lineHeight: 1 }}>
                      {appt.time.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#0f766e', marginTop: '2px' }}>
                      {appt.time.split(' ')[1]}
                    </span>
                  </div>

                  {/* Patient Avatar & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '12px',
                      backgroundColor: '#e0f2fe', color: '#0284c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '12px', flexShrink: 0,
                    }}>
                      {appt.patient?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT'}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {appt.patient?.name || 'Unknown'}
                      </p>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{appt.type || 'Consultation'}</p>
                    </div>
                  </div>

                  {/* Doctor Name */}
                  <p style={{ fontSize: '13px', color: '#334155', fontWeight: '600', margin: 0 }}>
                    Dr. {appt.doctor?.name || '—'}
                  </p>

                  {/* Status Badge */}
                  <StatusBadge status={appt.status} />

                  {/* Quick Action Button */}
                  <div>
                    {appt.status === 'checked_in' || appt.status === 'booked' ? (
                      <button
                        onClick={() => setActiveTab && setActiveTab('prescription')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#0d9488',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FileText size={12} />
                        <span>Rx</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab && setActiveTab('appointments')}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#475569',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Side Widgets Column ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Widget 1: OPD Live Queue Control */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#d97706" /> Live OPD Queue
              </h3>
              <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px' }}>
                {stats.waiting_today ?? 0} Waiting
              </span>
            </div>

            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Patients In Waiting Area
              </p>
              <p style={{ fontSize: '32px', fontWeight: '800', color: '#78350f', margin: '4px 0 0 0', lineHeight: 1 }}>
                {stats.waiting_today ?? 0}
              </p>
            </div>

            <button
              onClick={handleCallNextQueue}
              disabled={callingNext}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#d97706',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(217,119,6,0.25)',
              }}
            >
              <PhoneCall size={16} />
              <span>{callingNext ? 'Calling...' : 'Call Next Token'}</span>
            </button>
          </div>

          {/* Widget 2: 4 Quick Actions Grid */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#0d9488" /> Quick Actions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { icon: UserPlus, label: 'Add Patient', tab: 'patients', bg: '#ccfbf1', color: '#0d9488', border: '#99f6e4' },
                { icon: CalendarPlus, label: 'Appointment', tab: 'appointments', bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
                { icon: FileText, label: 'Prescription', tab: 'prescription', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
                { icon: CreditCard, label: 'Billing', tab: 'billing', bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
              ].map(({ icon: Icon, label, tab, bg, color, border }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab && setActiveTab(tab)}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '14px',
                    backgroundColor: bg,
                    border: `1px solid ${border}`,
                    color,
                    fontSize: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Widget 3: Premium Dark Clinic Summary Card */}
          {!loading && data?.tenant_name && (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '20px',
              padding: '22px',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(15,23,42,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{data.tenant_name}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>Qurelio Health Active Tenant</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'Today\'s Appts', val: stats.appointments_today ?? 0 },
                  { label: 'Completed',      val: stats.completed_today ?? 0 },
                  { label: 'In OPD Queue',   val: stats.waiting_today ?? 0 },
                  { label: 'New Patients',   val: stats.new_patients_today ?? 0 },
                ].map(({ label, val }) => (
                  <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px' }}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', lineHeight: 1, margin: '6px 0 0 0' }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tenant={tenant}
      />

      {/* Spin Keyframe Animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
