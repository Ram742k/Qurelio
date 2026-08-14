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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [auth, setAuth] = useState({
    token: localStorage.getItem('token') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    tenant: localStorage.getItem('tenant') ? JSON.parse(localStorage.getItem('tenant')) : null,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Verify existing token or user profile if stored
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken && (!auth.user || !auth.tenant)) {
        try {
          const res = await api.get('/me');
          if (res.data?.user && res.data?.tenant) {
            setAuth(prev => ({
              ...prev,
              user: res.data.user,
              tenant: res.data.tenant,
            }));
            localStorage.setItem('user', JSON.stringify(res.data.user));
            localStorage.setItem('tenant', JSON.stringify(res.data.tenant));
          }
        } catch (err) {
          console.warn('Session expired, logging out', err);
          handleLogout();
        }
      }
      setReady(true);
    };
    checkAuth();
  }, []);

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

  function renderPage() {
    switch (activeTab) {
      case 'dashboard':     return <Dashboard setActiveTab={setActiveTab} />;
      case 'patients':      return <Patients />;
      case 'appointments':  return <Appointments />;
      case 'billing':       return <Billing />;
      case 'queue':         return <Queue />;
      case 'prescription':
      case 'prescriptions': return <Prescriptions />;
      case 'reports':       return <Reports />;
      case 'settings':      return <Settings />;
      default:
        return (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <h3>{activeTab.toUpperCase()} Module</h3>
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
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={auth.user}
        tenant={auth.tenant}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '250px', display: 'flex', flexDirection: 'column' }}>
        <Header user={auth.user} tenant={auth.tenant} />
        <main style={{ flex: 1 }}>
          {ready && renderPage()}
        </main>
      </div>
    </div>
  );
}
