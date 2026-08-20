import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export default function Sidebar({ activeTab = 'patients', setActiveTab, user, tenant, onLogout }) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'patients', label: 'Patients', icon: Users, badge: 'Active' },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'queue', label: 'Queue', icon: Clock },
    { id: 'prescription', label: 'Prescription', icon: FileText },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userName = user?.name || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const userRole = user?.role === 'clinic_admin' ? 'Clinic Administrator' : (user?.role === 'doctor' ? 'Doctor / Physician' : 'Staff');

  return (
    <aside style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 40,
      boxSizing: 'border-box',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid #f1f5f9',
        height: '72px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: '#0d9488',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
          flexShrink: 0,
        }}>
          <ShieldCheck size={22} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tenant?.name || 'CliniCare'}
          </h1>
          <span style={{ fontSize: '10px', color: '#0d9488', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Qurelio Health
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'prescription' && activeTab === 'prescriptions');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab && setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#0d9488' : '#64748b',
                backgroundColor: isActive ? '#ccfbf1' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color={isActive ? '#0d9488' : '#64748b'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile Footer - Pinned Strictly at Very Bottom */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#f8fafc',
        marginTop: 'auto', // Pinned to absolute bottom of sidebar flex column
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#0d9488',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '13px',
          flexShrink: 0,
        }}>
          {userInitials}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </p>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userRole}
          </p>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: '#fee2e2', border: 'none',
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
