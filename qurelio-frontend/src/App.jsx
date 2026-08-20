import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';
import Queue from './pages/Queue';
import Prescriptions from './pages/Prescriptions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import api from './api/axios';

import PublicBooking from './pages/PublicBooking';
import GlobalSearchModal from './components/common/GlobalSearchModal';
import BottomNav from './components/navigation/BottomNav';
import TrialExpiryModal from './components/common/TrialExpiryModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    tenant: localStorage.getItem('tenant') ? JSON.parse(localStorage.getItem('tenant')) : null,
  });
  const [ready, setReady] = useState(false);
  const [autoOpenAppt, setAutoOpenAppt] = useState(false);
  const [autoOpenPatient, setAutoOpenPatient] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Ctrl + K / Cmd + K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Verify existing token or user profile if stored
    const checkAuth = async () => {
      if (!auth.token) {
        setReady(true);
        return;
      }
      try {
        const res = await api.get('/me');
        if (res.data?.user && res.data?.tenant) {
          setAuth(prev => ({ ...prev, user: res.data.user, tenant: res.data.tenant }));
          localStorage.setItem('user', JSON.stringify(res.data.user));
          localStorage.setItem('tenant', JSON.stringify(res.data.tenant));
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tenant');
          setAuth({ token: null, user: null, tenant: null });
        }
      } finally {
        setReady(true);
      }
    };
    checkAuth();
  }, []);

  // Public Booking standalone page check
  if (window.location.pathname.startsWith('/book') || window.location.search.includes('clinic=')) {
    return <PublicBooking />;
  }

  const handleLoginSuccess = ({ user, tenant, token }) => {
    setAuth({ user, tenant, token });
    setActiveTab('dashboard');
  };

  const handleOnboardingComplete = async () => {
    // Re-fetch /me so the updated tenant name/phone/timezone from onboarding
    // is reflected in the dashboard header, sidebar and everywhere else.
    try {
      const res = await api.get('/me');
      if (res.data?.user && res.data?.tenant) {
        const freshTenant = { ...res.data.tenant, onboarding_completed: true };
        setAuth(prev => ({ ...prev, user: res.data.user, tenant: freshTenant }));
        localStorage.setItem('user',   JSON.stringify(res.data.user));
        localStorage.setItem('tenant', JSON.stringify(freshTenant));
      }
    } catch {
      // Fallback: at minimum mark it done locally so guard unblocks
      setAuth(prev => ({
        ...prev,
        tenant: { ...prev.tenant, onboarding_completed: true },
      }));
      localStorage.setItem('tenant', JSON.stringify({ ...auth.tenant, onboarding_completed: true }));
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      // non-blocking
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setAuth({ token: null, user: null, tenant: null });
  };

  const handleQuickAction = (action) => {
    if (action === 'new_appointment') {
      setActiveTab('appointments');
      setAutoOpenAppt(true);
    } else if (action === 'add_patient') {
      setActiveTab('patients');
      setAutoOpenPatient(true);
    } else if (action === 'new_prescription') {
      setActiveTab('prescription');
    } else if (action === 'new_billing') {
      setActiveTab('billing');
    }
  };

  function renderPage() {
    switch (activeTab) {
      case 'dashboard':     return <Dashboard setActiveTab={setActiveTab} />;
      case 'patients':      return <Patients autoOpenCreate={autoOpenPatient} onResetAutoOpen={() => setAutoOpenPatient(false)} />;
      case 'appointments':  return <Appointments autoOpenCreate={autoOpenAppt} onResetAutoOpen={() => setAutoOpenAppt(false)} />;
      case 'billing':       return <Billing />;
      case 'queue':         return <Queue />;
      case 'prescription':
      case 'prescriptions': return <Prescriptions />;
      case 'reports':       return <Reports />;
      case 'settings':      return <Settings />;
      default:
        return (
          <div style={{ padding: '32px', color: '#64748b' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p style={{ marginTop: '8px' }}>Coming up in next phase.</p>
          </div>
        );
    }
  }

  // Not logged in → show Login
  if (!auth.token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Onboarding guard — only for admin/owner roles
  if (ready && auth.tenant && auth.tenant.onboarding_completed === false) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Day 14 Trial Expiry Full-Screen Block */}
      <TrialExpiryModal tenant={auth.tenant} />

      {/* ⌘K Global Search Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* Left Sidebar (Desktop Only) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={auth.user}
        tenant={auth.tenant}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? '0px' : '250px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        paddingBottom: isMobile ? '64px' : '0px',
      }}>
        <Header
          user={auth.user}
          tenant={auth.tenant}
          onOpenSearch={() => setIsSearchOpen(true)}
          onQuickAction={handleQuickAction}
        />
        <main style={{ flex: 1 }}>
          {ready && renderPage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (<768px Viewports) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
