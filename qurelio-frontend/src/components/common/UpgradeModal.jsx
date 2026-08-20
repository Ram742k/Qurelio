import React, { useState } from 'react';
import { X, Check, Zap, ShieldCheck, Sparkles, CreditCard, Award } from 'lucide-react';
import api from '../../api/axios';

export default function UpgradeModal({ isOpen, onClose, tenant, onUpgradeSuccess }) {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPlan = async (planKey) => {
    try {
      setLoading(true);
      // Simulate Razorpay or direct plan activation API
      const res = await api.put('/settings/clinic', {
        subscription_status: 'active',
        subscription_plan: planKey,
        plan: planKey,
      });

      if (onUpgradeSuccess) onUpgradeSuccess();
      alert(`🎉 Congratulations! Your clinic is now upgraded to the ${planKey.toUpperCase()} Plan!`);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Plan activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '720px',
        width: '100%',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0d9488', backgroundColor: '#ccfbf1', padding: '4px 10px', borderRadius: '12px' }}>
              Qurelio Health Pro Plans
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '8px 0 4px 0' }}>
              Upgrade Your Clinic Plan
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Unlock unlimited patients, WhatsApp prescription sharing, and multi-branch management.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Annual Discount Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: '#f8fafc',
          padding: '6px',
          borderRadius: '12px',
          width: 'max-content',
          margin: '0 auto 28px',
          border: '1px solid #e2e8f0',
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: billingCycle === 'monthly' ? '#ffffff' : 'transparent',
              color: billingCycle === 'monthly' ? '#0f172a' : '#64748b',
              boxShadow: billingCycle === 'monthly' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              backgroundColor: billingCycle === 'annual' ? '#0d9488' : 'transparent',
              color: billingCycle === 'annual' ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Annual Billing</span>
            <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '8px' }}>2 Months Free 🎉</span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Plan 1: Starter */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Starter Plan</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>Ideal for single-doctor OPD practices</p>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>
                  {billingCycle === 'annual' ? '₹799' : '₹999'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}> / month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#0d9488" /> Up to 500 Patients</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#0d9488" /> Appointments & OPD Queue</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#0d9488" /> Digital Prescription Builder</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#0d9488" /> GST Tax Billing & Export</li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('starter')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Select Starter Plan
            </button>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #0d9488',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.12)',
          }}>
            <span style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '3px 10px',
              borderRadius: '12px',
            }}>
              Most Popular
            </span>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Pro Plan <Sparkles size={16} color="#0d9488" />
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>For growing clinics and polyclinics</p>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>
                  {billingCycle === 'annual' ? '₹1,599' : '₹1,999'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}> / month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}><Check size={16} color="#0d9488" /> Unlimited Patients & Visits</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}><Check size={16} color="#0d9488" /> WhatsApp Rx 1-Click Auto Share</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#0d9488" /> Automated Follow-up Reminders</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#0d9488" /> Multi-Doctor Schedule Track</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#0d9488" /> Priority Phone & WhatsApp Support</li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
              }}
            >
              {loading ? 'Activating...' : 'Upgrade to Pro Plan'}
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color="#0d9488" />
          <span>100% Encrypted & Safe Payment via Razorpay. Cancel or change plan anytime.</span>
        </div>
      </div>
    </div>
  );
}
