import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Bell, Building2, CheckCircle2, AlertCircle, Clock, FileText, X, Search, Plus, ChevronDown, UserPlus, CreditCard, Zap } from 'lucide-react';

export default function Header({ user, tenant, onOpenSearch, onQuickAction }) {
  const [showQuickLinks, setShowQuickLinks] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const quickLinksRef = useRef(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Appointment Follow-up Due',
      message: 'John Doe visit follow-up reminder generated.',
      time: '10 mins ago',
      type: 'appointment',
      unread: true,
    },
    {
      id: 2,
      title: 'Online Payment Received',
      message: 'Invoice #INV-1002 paid via Razorpay (₹1,200).',
      time: '35 mins ago',
      type: 'payment',
      unread: true,
    },
    {
      id: 3,
      title: 'OPD Queue Alert',
      message: 'Token #A05 is now serving in Room 2.',
      time: '1 hour ago',
      type: 'queue',
      unread: true,
    },
  ]);

  const dropdownRef = useRef(null);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const userName = user?.name ? (user.name.startsWith('Dr') ? user.name : `Dr. ${user.name}`) : 'Doctor';
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (quickLinksRef.current && !quickLinksRef.current.contains(event.target)) {
        setShowQuickLinks(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment': return <Calendar size={14} color="#0d9488" />;
      case 'payment':     return <CheckCircle2 size={14} color="#16a34a" />;
      case 'queue':       return <Clock size={14} color="#2563eb" />;
      default:            return <Bell size={14} color="#8b5cf6" />;
    }
  };

  return (
    <header style={{
      height: '72px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Greeting Title */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Good morning, {userName} 👋
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
          Here's what's happening in your clinic today.
        </p>
      </div>

      {/* Global Search Trigger Bar (Ctrl + K) */}
      <button
        onClick={onOpenSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 14px',
          height: '38px',
          width: '280px',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          fontSize: '12px',
          color: '#64748b',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Search size={16} color="#94a3b8" style={{ minWidth: '16px', width: '16px', height: '16px' }} />
        <span>Search patients, appts, invoices...</span>
        <kbd style={{
          marginLeft: 'auto',
          fontSize: '10px',
          fontWeight: '700',
          color: '#64748b',
          backgroundColor: '#ffffff',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid #cbd5e1',
        }}>
          ⌘K
        </kbd>
      </button>

      {/* Right Tools & Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }} ref={dropdownRef}>
        {/* Quick Links Dropdown Button */}
        <div style={{ position: 'relative' }} ref={quickLinksRef}>
          <button
            onClick={() => setShowQuickLinks(!showQuickLinks)}
            style={{
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '12px',
              padding: '0 14px',
              height: '38px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={15} fill="#ffffff" />
            <span>Quick Links</span>
            <ChevronDown size={14} style={{ transform: showQuickLinks ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>

          {showQuickLinks && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '210px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e2e8f0',
              padding: '6px',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              <div style={{ padding: '6px 10px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                Create & Quick Actions
              </div>
              <button
                onClick={() => { setShowQuickLinks(false); onQuickAction && onQuickAction('new_appointment'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#0f172a', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ccfbf1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Calendar size={15} color="#0d9488" />
                <span>+ New Appointment</span>
              </button>
              <button
                onClick={() => { setShowQuickLinks(false); onQuickAction && onQuickAction('add_patient'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#0f172a', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ccfbf1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <UserPlus size={15} color="#2563eb" />
                <span>+ Add Patient</span>
              </button>
              <button
                onClick={() => { setShowQuickLinks(false); onQuickAction && onQuickAction('new_prescription'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#0f172a', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ccfbf1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileText size={15} color="#9333ea" />
                <span>+ New Prescription</span>
              </button>
              <button
                onClick={() => { setShowQuickLinks(false); onQuickAction && onQuickAction('new_billing'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#0f172a', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ccfbf1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <CreditCard size={15} color="#16a34a" />
                <span>+ Create Invoice</span>
              </button>
            </div>
          )}
        </div>

        {/* Clinic Name Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          backgroundColor: '#f1f5f9',
          fontSize: '12px',
          fontWeight: '600',
          color: '#475569',
        }}>
          <Building2 size={15} color="#0d9488" />
          <span>{tenant?.name || 'Sunrise Clinic'}</span>
        </div>

        {/* Date Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#64748b',
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}>
          <Calendar size={14} color="#0d9488" />
          <span>{currentDate}</span>
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notifications"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: showNotifications ? '#ccfbf1' : '#f8fafc',
            border: showNotifications ? '1px solid #0d9488' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: showNotifications ? '#0d9488' : '#64748b',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
            }} />
          )}
        </button>

        {/* Interactive Notification Popover Dropdown */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '340px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Notifications</h4>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    backgroundColor: '#ccfbf1', color: '#0d9488',
                    padding: '2px 8px', borderRadius: '10px',
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none', border: 'none',
                    fontSize: '12px', color: '#0d9488', fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification Items List */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No new notifications
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setNotifications(notifications.map(n => n.id === item.id ? { ...n, unread: false } : n));
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: item.unread ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (!item.unread) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (!item.unread) e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: '2px',
                    }}>
                      {getNotificationIcon(item.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <h5 style={{ fontSize: '13px', fontWeight: item.unread ? '700' : '600', color: '#0f172a' }}>
                          {item.title}
                        </h5>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{item.time}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

