import { useState } from 'react';
import api from '../api/axios';
import {
  ShieldCheck,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Stethoscope,
  KeyRound,
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [phone, setPhone] = useState('9840000000');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/login', {
        phone: phone.trim(),
        password: password,
      });

      const { token, user, tenant } = res.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tenant', JSON.stringify(tenant));

        if (onLoginSuccess) {
          onLoginSuccess({ user, tenant, token });
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message ||
        (err.response?.data?.errors?.phone ? err.response.data.errors.phone[0] : null) ||
        'Invalid phone number or password. Please try again.';
      setError(msg);
    }
    setLoading(false);
  };

  const fillDemoCredentials = (demoPhone, demoName) => {
    setPhone(demoPhone);
    setPassword('password');
    setError(null);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      
      {/* ── Left Hero Side (Branding & Key Features) ── */}
      <div style={{
        flex: '1.1',
        background: 'linear-gradient(135deg, #0f172a 0%, #0d9488 100%)',
        color: '#ffffff',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Decorative Rings */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '400px', height: '400px', borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '300px', height: '300px', borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none',
        }} />

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 10 }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1 }}>
              CliniCare
            </h1>
            <span style={{ fontSize: '11px', color: '#99f6e4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Qurelio Clinic Management SaaS
            </span>
          </div>
        </div>

        {/* Hero Copy & Feature List */}
        <div style={{ margin: '40px 0', zIndex: 10, maxWidth: '520px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '20px',
            backgroundColor: 'rgba(20, 184, 166, 0.25)',
            border: '1px solid rgba(153, 246, 228, 0.3)',
            fontSize: '12px', fontWeight: '700', color: '#ccfbf1',
            marginBottom: '20px',
          }}>
            <Sparkles size={14} /> Production-Ready Healthcare Platform
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Empowering Modern Clinics & OPD Consultations.
          </h2>
          <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '32px' }}>
            Streamline patient check-ins, manage live doctor queues, generate vector prescriptions, and process online payments — all in one unified portal.
          </p>

          {/* Key Value Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              'Real-Time OPD Queue Management & Live Token Counter',
              'Structured Prescription Builder with Vector PDF & WhatsApp Share',
              'Integrated Razorpay & PhonePe Billing Engine',
              'Multi-Tenant Data Isolation & Role-Based Access Security',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  backgroundColor: '#0d9488', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CheckCircle2 size={14} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px', zIndex: 10 }}>
          © 2026 Qurelio Health Inc. Encrypted & HIPAA-Compliant Data Standard.
        </div>
      </div>

      {/* ── Right Side (Interactive Login Form) ── */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: '#ffffff',
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Welcome Back 👋
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
              Enter your registered phone number and password to access your clinic.
            </p>
          </div>

          {/* Quick Demo Credentials Switcher Chips */}
          <div style={{
            backgroundColor: '#f8fafc', borderRadius: '14px',
            border: '1px solid #e2e8f0', padding: '14px 16px',
            marginBottom: '24px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={13} color="#0d9488" /> Demo Accounts Quick-Fill:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillDemoCredentials('9840000000', 'Ram Admin')}
                style={{
                  padding: '6px 12px', borderRadius: '8px',
                  backgroundColor: phone === '9840000000' ? '#ccfbf1' : '#fff',
                  border: phone === '9840000000' ? '1px solid #0d9488' : '1px solid #cbd5e1',
                  color: phone === '9840000000' ? '#0f766e' : '#475569',
                  fontSize: '12px', fontWeight: '700',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <Building2 size={13} /> Clinic Admin (9840000000)
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('9840000001', 'Dr. Arun')}
                style={{
                  padding: '6px 12px', borderRadius: '8px',
                  backgroundColor: phone === '9840000001' ? '#ccfbf1' : '#fff',
                  border: phone === '9840000001' ? '1px solid #0d9488' : '1px solid #cbd5e1',
                  color: phone === '9840000001' ? '#0f766e' : '#475569',
                  fontSize: '12px', fontWeight: '700',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <Stethoscope size={13} /> Dr. Arun (9840000001)
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Error Notification Banner */}
            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '12px',
                backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', lineHeight: 1.4 }}>{error}</p>
              </div>
            )}

            {/* Phone Input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{
                  position: 'absolute', left: '12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: '#64748b', fontSize: '13px', fontWeight: '600',
                  borderRight: '1px solid #cbd5e1', paddingRight: '10px',
                }}>
                  <Phone size={15} color="#0d9488" />
                  <span>+91</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{
                    width: '100%', height: '46px',
                    paddingLeft: '78px', paddingRight: '14px',
                    borderRadius: '10px', border: '1px solid #cbd5e1',
                    fontSize: '14px', fontWeight: '600', color: '#0f172a',
                    backgroundColor: '#fff', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your Clinic Administrator to reset password.'); }} style={{ fontSize: '12px', color: '#0d9488', fontWeight: '600', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', height: '46px',
                    paddingLeft: '42px', paddingRight: '42px',
                    borderRadius: '10px', border: '1px solid #cbd5e1',
                    fontSize: '14px', color: '#0f172a',
                    backgroundColor: '#fff', outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px',
                    background: 'none', border: 'none',
                    color: '#64748b', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0d9488', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}>
                Remember session on this browser
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                height: '48px',
                borderRadius: '10px',
                backgroundColor: loading ? '#99f6e4' : '#0d9488',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Clinic</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* Footer note */}
          <div style={{ marginTop: '36px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Need a new clinic account? Contact <strong style={{ color: '#0d9488' }}>support@qurelio.com</strong>
            </p>
          </div>

        </div>
      </div>

      {/* Animation spinner style */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
