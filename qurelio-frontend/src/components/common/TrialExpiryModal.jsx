import React, { useState } from 'react';
import { ShieldCheck, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

export default function TrialExpiryModal({ tenant, onUpgradeSuccess }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!tenant) return null;
  if (tenant.plan && tenant.plan !== 'trial' && tenant.subscription_status === 'active') return null;

  const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date(Date.now() + 14 * 86400000);
  const now = new Date();
  const diffTime = trialEnd - now;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Only trigger full-screen block when trial has expired (daysLeft <= 0)
  if (daysLeft > 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        maxWidth: '540px',
        width: '100%',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        border: '1px solid #e2e8f0',
      }}>
        {/* Lock Icon Badge */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Lock size={32} />
        </div>

        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', backgroundColor: '#fee2e2', padding: '4px 12px', borderRadius: '12px' }}>
          14-Day Free Trial Completed
        </span>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '14px 0 8px 0' }}>
          Your Trial Period Has Ended
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Select a subscription plan to continue managing appointments, prescriptions, and billing seamlessly.
        </p>

        {/* Data Protection Reassurance Box */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '14px',
          padding: '14px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
        }}>
          <ShieldCheck size={24} color="#0d9488" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '12px', fontWeight: '800', color: '#166534', margin: 0 }}>
              Your Clinic Data Is 100% Safe & Saved
            </p>
            <p style={{ fontSize: '11px', color: '#15803d', margin: '2px 0 0 0' }}>
              All your patient history, prescriptions, and records remain preserved safely.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUpgradeModal(true)}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#0d9488',
            color: '#ffffff',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(13, 148, 136, 0.3)',
          }}
        >
          <Sparkles size={18} />
          <span>Select A Plan & Continue</span>
          <ArrowRight size={18} />
        </button>

        {/* Modal inside expiry dialog */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          tenant={tenant}
          onUpgradeSuccess={onUpgradeSuccess}
        />
      </div>
    </div>
  );
}
