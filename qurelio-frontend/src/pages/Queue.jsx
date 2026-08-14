import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Clock,
  User,
  Users,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Plus,
  Play,
  Check,
  FastForward,
  UserCheck,
  Calendar,
  Activity,
} from 'lucide-react';

const STATUS_BADGES = {
  waiting: { label: 'Waiting',  bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  serving: { label: 'Serving',  bg: '#fef9c3', color: '#a16207', border: '#fde047' },
  done:    { label: 'Completed',bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  skipped: { label: 'Skipped',  bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGES[status] || { label: status, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-block', fontSize: '11px', fontWeight: '700',
      padding: '3px 10px', borderRadius: '20px',
      backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

export default function Queue() {
  const [doctors, setDoctors]         = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [queueData, setQueueData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState(null);

  // Action loading states
  const [actioningId, setActioningId] = useState(null); // ID of token undergoing status change
  const [callingNext, setCallingNext] = useState(false);

  // Fetch doctors for selector
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/doctors');
      const docs = res.data?.data || [];
      setDoctors(docs);
      if (docs.length > 0 && !selectedDoctor) {
        setSelectedDoctor(docs[0].id);
      }
    } catch (err) {
      console.error('Failed to load doctors list', err);
    }
  }, [selectedDoctor]);

  // Fetch queue data for selected doctor
  const fetchQueue = useCallback(async (showLoading = false) => {
    if (!selectedDoctor) return;
    if (showLoading) setLoading(true);
    setApiError(null);
    try {
      const res = await api.get('/queue/today', {
        params: { doctor_id: selectedDoctor }
      });
      setQueueData(res.data?.data || null);
    } catch (err) {
      setApiError('Unable to load queue. Please try again.');
    }
    if (showLoading) setLoading(false);
  }, [selectedDoctor]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  useEffect(() => {
    fetchQueue(true);
  }, [selectedDoctor, fetchQueue]);

  // Polling fallback: auto-refresh every 12 seconds
  useEffect(() => {
    if (!selectedDoctor) return;
    const timer = setInterval(() => {
      fetchQueue(false);
    }, 12000);
    return () => clearInterval(timer);
  }, [selectedDoctor, fetchQueue]);

  // Queue actions
  async function handleCallNext() {
    if (callingNext) return;
    setCallingNext(true);
    try {
      const res = await api.post('/queue/next', { doctor_id: selectedDoctor });
      alert(res.data?.message || 'Called next patient!');
      fetchQueue(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to call next patient.');
    }
    setCallingNext(false);
  }

  async function handleServe(tokenId) {
    setActioningId(tokenId);
    try {
      const res = await api.post(`/queue/${tokenId}/serve`);
      fetchQueue(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to serve token.');
    }
    setActioningId(null);
  }

  async function handleComplete(tokenId) {
    if (!window.confirm('Mark this patient consultation as completed?')) return;
    setActioningId(tokenId);
    try {
      await api.post(`/queue/${tokenId}/complete`);
      fetchQueue(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete token.');
    }
    setActioningId(null);
  }

  async function handleSkip(tokenId) {
    if (!window.confirm('Skip this token?')) return;
    setActioningId(tokenId);
    try {
      await api.post(`/queue/${tokenId}/skip`);
      fetchQueue(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to skip token.');
    }
    setActioningId(null);
  }

  // Format Helper
  function formatTime(isoStr) {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const nowServing = queueData?.now_serving;
  const nextPatient = queueData?.next;
  const waitingList = queueData?.waiting || [];
  const completedList = queueData?.completed || [];
  const skippedList = queueData?.skipped || [];
  const waitingCount = queueData?.waiting_count || 0;

  return (
    <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            OPD Consultation Queue ⏰
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Manage today's patient flow and consultation queue.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Doctor selector */}
          <select
            value={selectedDoctor}
            onChange={e => setSelectedDoctor(e.target.value)}
            style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: '13px', color: '#475569', fontWeight: '600' }}
          >
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name.startsWith('Dr') ? d.name : `Dr. ${d.name}`}</option>)}
          </select>

          {/* Status Indicator */}
          <span style={{ fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#f0fdf4', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #99f6e4' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: '#0d9488', borderRadius: '50%', display: 'inline-block' }} />
            Auto-refresh active
          </span>

          <button
            onClick={() => fetchQueue(true)}
            style={{ height: '42px', width: '42px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Refresh queue"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Summary Counters ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Now Serving</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#a16207', marginTop: '6px' }}>
            {nowServing ? nowServing.token_number : '—'}
          </p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Token</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1', marginTop: '6px' }}>
            {nextPatient ? nextPatient.token_number : '—'}
          </p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waiting Count</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#0d9488', marginTop: '6px' }}>{waitingCount}</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Today</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', marginTop: '6px' }}>{completedList.length}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px' }}>Loading live queue...</p>
        </div>
      ) : apiError ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #fee2e2', padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={32} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ color: '#dc2626', marginBottom: '8px' }}>Failed to load queue</h4>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{apiError}</p>
          <button onClick={() => fetchQueue(true)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '13px' }}>
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
          
          {/* ── Left: Waiting Queue ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Waiting Queue List</h3>
              </div>

              {waitingList.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <Users size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>Queue is clear</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>No patients are waiting in the queue.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Token</th>
                      <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Patient</th>
                      <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Appt Time</th>
                      <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Doctor</th>
                      <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>Status</th>
                      <th style={{ padding: '12px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingList.map((token, idx) => (
                      <tr key={token.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '12px 20px', fontWeight: '800', color: '#0d9488', fontSize: '14px' }}>
                          {token.token_number}
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: '700', color: '#0f172a' }}>
                          {token.patient?.name || '—'}
                        </td>
                        <td style={{ padding: '12px 20px', color: '#64748b' }}>
                          {formatTime(token.scheduled_at)}
                        </td>
                         <td style={{ padding: '12px 20px', color: '#475569', fontWeight: '500' }}>
                           {token.doctor?.name?.startsWith('Dr') ? token.doctor.name : `Dr. ${token.doctor?.name || '—'}`}
                         </td>
                        <td style={{ padding: '12px 20px' }}>
                          <StatusBadge status={token.status} />
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleServe(token.id)}
                            disabled={actioningId === token.id}
                            style={{
                              padding: '5px 12px', borderRadius: '6px',
                              backgroundColor: '#0d9488', color: '#fff',
                              fontSize: '12px', fontWeight: '600',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Play size={12} /> Serve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Completed & Skipped History */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Completed */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} /> Completed consultations
                </h4>
                {completedList.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', padding: '10px 0' }}>No consultations completed yet today.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {completedList.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 8px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                        <span style={{ fontWeight: '700', color: '#166534' }}>{t.token_number}</span>
                        <span style={{ fontWeight: '600', color: '#475569' }}>{t.patient?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skipped */}
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#b91c1c', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FastForward size={15} /> Skipped tokens
                </h4>
                {skippedList.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', padding: '10px 0' }}>No tokens skipped yet today.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {skippedList.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 8px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                        <span style={{ fontWeight: '700', color: '#991b1b' }}>{t.token_number}</span>
                        <span style={{ fontWeight: '600', color: '#475569' }}>{t.patient?.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Right side: Now Serving & Next ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Now Serving Card */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Activity size={16} color="#a16207" />
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Now Serving
                </h3>
              </div>

              {nowServing ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '16px',
                      backgroundColor: '#fef9c3', border: '2px solid #fde047',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '20px', color: '#a16207',
                    }}>
                      {nowServing.token_number}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                        {nowServing.patient?.name}
                      </h4>
                      <p style={{ fontSize: '11px', color: '#a16207', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                        MRN: PT-{nowServing.patient?.id}
                      </p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fafafa', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                     <p>Doctor: <strong>{nowServing.doctor?.name?.startsWith('Dr') ? nowServing.doctor.name : `Dr. ${nowServing.doctor?.name}`}</strong></p>
                    <p>Appt Time: <strong>{formatTime(nowServing.scheduled_at)}</strong></p>
                    <p>Consultation type: <strong>General OPD</strong></p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleComplete(nowServing.id)}
                      disabled={actioningId === nowServing.id}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '8px',
                        backgroundColor: '#10b981', color: '#fff',
                        fontSize: '13px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <Check size={14} /> Complete
                    </button>
                    <button
                      onClick={() => handleSkip(nowServing.id)}
                      disabled={actioningId === nowServing.id}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '8px',
                        backgroundColor: '#fff', border: '1px solid #fee2e2',
                        color: '#ef4444', fontSize: '13px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                      }}
                    >
                      <FastForward size={14} /> Skip
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>
                  <Clock size={32} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                  <p style={{ fontSize: '13px' }}>No patient is currently being served.</p>
                </div>
              )}
            </div>

            {/* Next Patient Card */}
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Next Patient
              </h3>

              {nextPatient ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '15px', color: '#0369a1',
                    }}>
                      {nextPatient.token_number}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                        {nextPatient.patient?.name}
                      </h4>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>
                        Scheduled: {formatTime(nextPatient.scheduled_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCallNext}
                    disabled={callingNext}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: '8px',
                      backgroundColor: '#0d9488', color: '#fff',
                      fontSize: '13px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
                    }}
                  >
                    {callingNext ? 'Calling...' : <><UserCheck size={14} /> Call Next</>}
                  </button>
                </div>
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8' }}>
                  <p style={{ fontSize: '12px' }}>No patients waiting in queue.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Animation spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
