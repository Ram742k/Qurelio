import React, { useState, useEffect } from 'react';
import { Activity, Calendar, Users, FileText, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMobile) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'appointments', label: 'Appts', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'prescription', label: 'Rx', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      padding: '6px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)',
    }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.id === 'prescription' && activeTab === 'prescriptions');
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab && setActiveTab(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isActive ? '#ccfbf1' : 'transparent',
              color: isActive ? '#0d9488' : '#64748b',
              fontWeight: isActive ? '700' : '500',
              cursor: 'pointer',
            }}
          >
            <Icon size={18} />
            <span style={{ fontSize: '10px', marginTop: '2px' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
