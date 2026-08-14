import React, { useState, useEffect } from 'react';
import API from '../api/axios';

// ─── Timezone presets ─────────────────────────────────────────────────────────
const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const defaultWorkingHours = () => ({
  monday:    { open: true,  start: '09:00', end: '18:00' },
  tuesday:   { open: true,  start: '09:00', end: '18:00' },
  wednesday: { open: true,  start: '09:00', end: '18:00' },
  thursday:  { open: true,  start: '09:00', end: '18:00' },
  friday:    { open: true,  start: '09:00', end: '18:00' },
  saturday:  { open: true,  start: '09:00', end: '14:00' },
  sunday:    { open: false, start: '09:00', end: '18:00' },
});

// ─── Progress stepper component ───────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        const pending = i > current;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: 14, transition: 'all 0.3s',
                background: done ? '#0d9488' : active ? '#0d9488' : '#e2e8f0',
                color: done || active ? '#fff' : '#94a3b8',
                boxShadow: active ? '0 0 0 4px rgba(13,148,136,0.2)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? '#0d9488' : done ? '#0f766e' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 18, minWidth: 40, maxWidth: 80,
                background: i < current ? '#0d9488' : '#e2e8f0',
                transition: 'background 0.4s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, children, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
        borderRadius: 10, fontSize: 14, color: '#1e293b', background: '#f8fafc',
        outline: 'none', transition: 'border 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
        ...(props.style || {}),
      }}
      onFocus={e => { e.target.style.border = '1.5px solid #0d9488'; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.12)'; }}
      onBlur={e  => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

// ─── Step 1 — Clinic Details ──────────────────────────────────────────────────
function StepClinic({ data, onChange, errors }) {
  const f = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Clinic Information</h3>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
        Help patients find you with accurate contact details.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Clinic Name" required error={errors.name}>
            <Input value={data.name || ''} onChange={e => f('name', e.target.value)} placeholder="e.g. Sunrise Family Clinic" />
          </Field>
        </div>
        <Field label="Phone" error={errors.phone}>
          <Input value={data.phone || ''} onChange={e => f('phone', e.target.value)} placeholder="+91 98400 00000" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={data.email || ''} onChange={e => f('email', e.target.value)} placeholder="clinic@example.com" />
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Address" error={errors.address}>
            <Input value={data.address || ''} onChange={e => f('address', e.target.value)} placeholder="Street / Building" />
          </Field>
        </div>
        <Field label="City" error={errors.city}>
          <Input value={data.city || ''} onChange={e => f('city', e.target.value)} placeholder="Chennai" />
        </Field>
        <Field label="State" error={errors.state}>
          <Input value={data.state || ''} onChange={e => f('state', e.target.value)} placeholder="Tamil Nadu" />
        </Field>
        <Field label="PIN Code" error={errors.pincode}>
          <Input value={data.pincode || ''} onChange={e => f('pincode', e.target.value)} placeholder="600001" maxLength={10} />
        </Field>
        <Field label="Country" error={errors.country}>
          <Input value={data.country || ''} onChange={e => f('country', e.target.value)} placeholder="India" />
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Timezone" error={errors.timezone}>
            <select
              value={data.timezone || 'Asia/Kolkata'}
              onChange={e => f('timezone', e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
                borderRadius: 10, fontSize: 14, color: '#1e293b', background: '#f8fafc',
                boxSizing: 'border-box',
              }}
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 — Working Hours ───────────────────────────────────────────────────
function StepWorkingHours({ data, onChange }) {
  const updateDay = (day, field, value) => {
    onChange({ ...data, [day]: { ...data[day], [field]: value } });
  };
  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Working Hours</h3>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
        Set your clinic's daily schedule. Toggle off days you are closed.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DAYS.map(day => {
          const d = data[day] || { open: false, start: '09:00', end: '18:00' };
          return (
            <div key={day} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', borderRadius: 12,
              background: d.open ? '#f0fdfa' : '#f8fafc',
              border: `1.5px solid ${d.open ? '#5eead4' : '#e2e8f0'}`,
              transition: 'all 0.2s',
            }}>
              {/* Toggle */}
              <button
                onClick={() => updateDay(day, 'open', !d.open)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: d.open ? '#0d9488' : '#cbd5e1', position: 'relative',
                  transition: 'background 0.25s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: d.open ? 22 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </button>

              {/* Day name */}
              <span style={{
                width: 32, fontSize: 13, fontWeight: 700,
                color: d.open ? '#0f766e' : '#94a3b8',
              }}>{DAY_LABELS[day]}</span>
              <span style={{
                flex: 1, fontSize: 13, fontWeight: 500,
                color: d.open ? '#0f172a' : '#94a3b8',
                textTransform: 'capitalize',
              }}>{day}</span>

              {d.open ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="time"
                    value={d.start}
                    onChange={e => updateDay(day, 'start', e.target.value)}
                    style={{ padding: '6px 10px', border: '1.5px solid #5eead4', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a' }}
                  />
                  <span style={{ fontSize: 13, color: '#64748b' }}>to</span>
                  <input
                    type="time"
                    value={d.end}
                    onChange={e => updateDay(day, 'end', e.target.value)}
                    style={{ padding: '6px 10px', border: '1.5px solid #5eead4', borderRadius: 8, fontSize: 13, background: '#fff', color: '#0f172a' }}
                  />
                </div>
              ) : (
                <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3 — Review ──────────────────────────────────────────────────────────
function StepReview({ clinic, hours }) {
  const openDays = DAYS.filter(d => hours[d]?.open);
  return (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Review Your Setup</h3>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>
        Everything looks good? Click <strong>Complete Setup</strong> to go live.
      </p>

      {/* Clinic card */}
      <div style={{ background: '#f0fdfa', border: '1.5px solid #5eead4', borderRadius: 14, padding: 20, marginBottom: 18 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Clinic Details
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
          {[
            ['Clinic Name', clinic.name],
            ['Phone',       clinic.phone   || '—'],
            ['Email',       clinic.email   || '—'],
            ['City',        clinic.city    || '—'],
            ['State',       clinic.state   || '—'],
            ['Pincode',     clinic.pincode || '—'],
            ['Country',     clinic.country || '—'],
            ['Timezone',    clinic.timezone || 'Asia/Kolkata'],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{k}</span>
              <p style={{ margin: 0, fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{v}</p>
            </div>
          ))}
          {clinic.address && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Address</span>
              <p style={{ margin: 0, fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{clinic.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Working hours card */}
      <div style={{ background: '#fafafa', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Working Hours
        </p>
        {openDays.length === 0
          ? <p style={{ color: '#94a3b8', fontSize: 14 }}>No open days configured.</p>
          : openDays.map(day => (
            <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{day}</span>
              <span style={{ fontSize: 14, color: '#0d9488' }}>{hours[day].start} – {hours[day].end}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  const STEPS = [
    { key: 'clinic',  label: 'Clinic Info' },
    { key: 'hours',   label: 'Working Hours' },
    { key: 'review',  label: 'Review' },
    { key: 'done',    label: 'Done' },
  ];

  const [step,   setStep]   = useState(0);
  const [clinic, setClinic] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', country: 'India', pincode: '', timezone: 'Asia/Kolkata' });
  const [hours,  setHours]  = useState(defaultWorkingHours());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  // Load existing data on mount
  useEffect(() => {
    API.get('/onboarding')
      .then(res => {
        const d = res.data;
        if (d.data?.clinic) {
          setClinic(prev => ({ ...prev, ...d.data.clinic }));
        }
        if (d.data?.working_hours) {
          setHours(d.data.working_hours);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Step 1 save
  const saveClinic = async () => {
    if (!clinic.name?.trim()) {
      setErrors({ name: 'Clinic name is required.' });
      return false;
    }
    setSaving(true);
    setErrors({});
    try {
      await API.put('/onboarding/clinic', clinic);
      showToast('Clinic details saved!');
      return true;
    } catch (err) {
      const errs = err.response?.data?.errors || {};
      setErrors(errs);
      showToast(err.response?.data?.message || 'Save failed.', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2 save
  const saveHours = async () => {
    setSaving(true);
    try {
      await API.put('/onboarding/working-hours', { working_hours: hours });
      showToast('Working hours saved!');
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed.', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ── Final complete
  const completeSetup = async () => {
    setSaving(true);
    try {
      await API.post('/onboarding/complete');
      setStep(3);
      showToast('Setup complete! Welcome to Qurelio 🎉');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not complete setup.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step === 0) {
      const ok = await saveClinic();
      if (ok) setStep(1);
    } else if (step === 1) {
      const ok = await saveHours();
      if (ok) setStep(2);
    } else if (step === 2) {
      await completeSetup();
    }
  };

  const back = () => setStep(s => Math.max(0, s - 1));

  // ─ Done screen
  if (step === 3) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            fontSize: 36, boxShadow: '0 8px 32px rgba(13,148,136,0.3)',
          }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
            You're all set!
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
            Welcome to <strong>Qurelio</strong>. Your clinic is configured and ready.<br />
            Let's start managing your practice.
          </p>
          <button
            onClick={onComplete}
            style={{
              padding: '14px 36px', background: 'linear-gradient(135deg, #0d9488, #059669)',
              color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(13,148,136,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 24px rgba(13,148,136,0.45)'; }}
            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 16px rgba(13,148,136,0.35)'; }}
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdfa',
          color: toast.type === 'error' ? '#dc2626' : '#0d9488',
          border: `1.5px solid ${toast.type === 'error' ? '#fecaca' : '#5eead4'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '20px 32px', background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #0d9488, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 16,
        }}>Q</div>
        <div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Qurelio</span>
          <span style={{ marginLeft: 12, fontSize: 13, color: '#64748b' }}>Clinic Setup Wizard</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>
          <StepIndicator steps={STEPS.slice(0, 3)} current={step} />

          {/* Card */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: 36,
            boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9',
          }}>
            {step === 0 && <StepClinic data={clinic} onChange={setClinic} errors={errors} />}
            {step === 1 && <StepWorkingHours data={hours} onChange={setHours} />}
            {step === 2 && <StepReview clinic={clinic} hours={hours} />}

            {/* Navigation */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9',
            }}>
              <button
                onClick={back}
                disabled={step === 0 || saving}
                style={{
                  padding: '10px 24px', background: 'transparent', color: '#64748b',
                  border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.4 : 1,
                }}
              >
                ← Back
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Step {step + 1} of 3</span>
                <button
                  onClick={next}
                  disabled={saving}
                  style={{
                    padding: '10px 28px',
                    background: saving
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #0d9488, #059669)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                    boxShadow: saving ? 'none' : '0 4px 14px rgba(13,148,136,0.3)',
                    transition: 'all 0.2s',
                    minWidth: 140,
                  }}
                >
                  {saving
                    ? '⏳ Saving…'
                    : step === 2
                      ? '🚀 Complete Setup'
                      : 'Save & Continue →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
