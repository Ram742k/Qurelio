import React from 'react';
import { Clock, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function TrialBanner({ tenant, onOpenUpgrade }) {
  if (!tenant) return null;
  if (tenant.plan && tenant.plan !== 'trial' && tenant.subscription_status === 'active') return null;

  const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date(Date.now() + 14 * 86400000);
  const now = new Date();
  const diffTime = trialEnd - now;
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  if (daysLeft <= 0) return null; // TrialExpiryModal handles full-screen block when expired

  return (
    <div style={{
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '14px',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: '#0d9488',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Clock size={16} />
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '800', color: '#065f46', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{daysLeft} days left in your 14-day free trial</span>
            <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 7px', borderRadius: '12px' }}>Full Features</span>
          </p>
          <p style={{ fontSize: '11px', color: '#047857', margin: '2px 0 0 0' }}>
            Upgrade anytime to ensure uninterrupted access to unlimited patient records & prescriptions.
          </p>
        </div>
      </div>

      <button
        onClick={onOpenUpgrade}
        style={{
          backgroundColor: '#0d9488',
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '12px',
          padding: '8px 16px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
          transition: 'all 0.15s ease',
        }}
      >
        <Zap size={14} fill="#ffffff" />
        <span>Upgrade Now</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
