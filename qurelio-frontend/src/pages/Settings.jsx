import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Settings as SettingsIcon,
  Building2,
  Clock,
  UserCheck,
  Users,
  CreditCard,
  Bell,
  Sliders,
  Shield,
  User,
  Database,
  FileText,
  Save,
  Plus,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Lock,
} from 'lucide-react';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // General Settings state
  const [generalData, setGeneralData] = useState({
    clinic_name: '',
    practice_type: 'clinic',
    timezone: 'Asia/Kolkata',
    language: 'English',
    currency: 'INR (₹)',
    date_format: 'DD/MM/YYYY',
  });

  // Clinic Profile state
  const [clinicData, setClinicData] = useState({
    name: '', logo_url: '', cover_image_url: '', phone: '', email: '',
    address: '', city: '', state: '', country: 'India', pincode: '', website: '',
  });

  // Working Hours state
  const [workingHours, setWorkingHours] = useState({});

  // Doctor Management state
  const [doctorsList, setDoctorsList] = useState([]);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', email: '', phone: '', password: '' });

  // Staff Management state
  const [staffList, setStaffList] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role: 'receptionist', password: '' });

  // Billing Settings state
  const [billingData, setBillingData] = useState({
    invoice_prefix: 'INV-', tax_percentage: 0, currency: 'INR', default_due_days: 7,
    payment_methods: ['cash', 'upi', 'card'],
  });

  // Notification Settings state
  const [notifData, setNotifData] = useState({
    sms_appointment_reminder: true, sms_followup_reminder: true,
    whatsapp_appointment: true, whatsapp_prescription: true,
    email_invoice: true, email_confirmation: true, queue_alerts: true,
  });

  // Integration Settings state
  const [integData, setIntegData] = useState({
    razorpay: { connected: false, key_id: '' },
    phonepe: { connected: false, merchant_id: '' },
    whatsapp: { connected: false, phone_number_id: '' },
    smtp: { connected: false, host: '' },
    storage: { connected: false, provider: 's3' },
  });

  // Security & Password state
  const [secData, setSecData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });

  // User Profile state
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });

  // Backup state
  const [backupInfo, setBackupInfo] = useState(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

  const menuSections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'clinic', label: 'Clinic Profile', icon: Building2 },
    { id: 'working-hours', label: 'Working Hours', icon: Clock },
    { id: 'doctors', label: 'Doctor Management', icon: UserCheck },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'billing', label: 'Billing Settings', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Sliders },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'backup', label: 'Database Backup', icon: Database },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  // Track loaded sections for instant switching
  const [loadedSections, setLoadedSections] = useState({});

  useEffect(() => {
    if (!loadedSections[activeSection]) {
      loadSectionData(activeSection);
    }
  }, [activeSection]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSectionData = async (section) => {
    setLoading(true);
    try {
      if (section === 'general') {
        const res = await api.get('/settings/general');
        if (res.data?.data) setGeneralData(res.data.data);
      } else if (section === 'clinic') {
        const res = await api.get('/settings/clinic');
        if (res.data?.data) setClinicData(res.data.data);
      } else if (section === 'working-hours') {
        const res = await api.get('/settings/working-hours');
        if (res.data?.data) setWorkingHours(res.data.data);
      } else if (section === 'doctors') {
        const res = await api.get('/settings/doctors');
        if (res.data?.data) setDoctorsList(res.data.data);
      } else if (section === 'staff') {
        const res = await api.get('/settings/staff');
        if (res.data?.data) setStaffList(res.data.data);
      } else if (section === 'billing') {
        const res = await api.get('/settings/billing');
        if (res.data?.data) setBillingData(res.data.data);
      } else if (section === 'notifications') {
        const res = await api.get('/settings/notifications');
        if (res.data?.data) setNotifData(res.data.data);
      } else if (section === 'integrations') {
        const res = await api.get('/settings/integrations');
        if (res.data?.data) setIntegData(res.data.data);
      } else if (section === 'profile') {
        const res = await api.get('/settings/profile');
        if (res.data?.data) setProfileData(res.data.data);
      } else if (section === 'backup') {
        const res = await api.get('/settings/backup');
        if (res.data?.data) setBackupInfo(res.data.data);
      } else if (section === 'audit-logs') {
        const res = await api.get('/settings/audit-logs');
        if (res.data?.data) setAuditLogs(res.data.data);
      }
      setLoadedSections(prev => ({ ...prev, [section]: true }));
    } catch (err) {
      console.error(`Failed to load ${section} settings`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/general', generalData);
      showToast('Settings updated successfully.');
    } catch (err) {
      alert('Failed to update general settings');
    } finally { setSaving(false); }
  };

  const handleSaveClinic = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/clinic', clinicData);
      showToast('Clinic profile updated successfully.');
    } catch (err) {
      alert('Failed to update clinic profile');
    } finally { setSaving(false); }
  };

  const handleSaveWorkingHours = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/working-hours', { working_hours: workingHours });
      showToast('Working hours updated successfully.');
    } catch (err) {
      alert('Failed to update working hours');
    } finally { setSaving(false); }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/doctors', newDoc);
      showToast('Doctor added successfully.');
      setShowAddDocModal(false);
      setNewDoc({ name: '', email: '', phone: '', password: '' });
      loadSectionData('doctors');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add doctor');
    } finally { setSaving(false); }
  };

  const handleDeleteDoctor = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this doctor?')) return;
    try {
      await api.delete(`/settings/doctors/${docId}`);
      showToast('Doctor removed successfully.');
      loadSectionData('doctors');
    } catch (err) {
      alert('Failed to remove doctor');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/staff', newStaff);
      showToast('Staff member added successfully.');
      setShowAddStaffModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'receptionist', password: '' });
      loadSectionData('staff');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add staff member');
    } finally { setSaving(false); }
  };

  const handleSaveBilling = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/billing', billingData);
      showToast('Billing settings updated successfully.');
    } catch (err) {
      alert('Failed to update billing settings');
    } finally { setSaving(false); }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/notifications', notifData);
      showToast('Notification preferences updated successfully.');
    } catch (err) {
      alert('Failed to update notification preferences');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (secData.new_password !== secData.new_password_confirmation) {
      alert('New passwords do not match!');
      return;
    }
    setSaving(true);
    try {
      await api.post('/settings/security/change-password', secData);
      showToast('Password updated successfully.');
      setSecData({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/profile', profileData);
      showToast('Profile updated successfully.');
    } catch (err) {
      alert('Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleTriggerBackup = async () => {
    setSaving(true);
    try {
      const res = await api.post('/settings/backup/trigger');
      showToast('Manual database backup completed.');
      setBackupInfo(prev => ({ ...prev, last_backup: res.data?.timestamp }));
    } catch (err) {
      alert('Failed to create backup');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
          backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 20px',
          borderRadius: '10px', boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600',
        }}>
          <CheckCircle2 color="#0d9488" size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Clinic Settings & Administration</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>Configure clinic details, staff roles, billing options, integrations, and security policies.</p>
      </div>

      {/* Main Settings Container: Sidebar + Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        {/* Settings Sub-Sidebar */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px', padding: '12px',
          border: '1px solid #e2e8f0', height: 'fit-content',
        }}>
          {menuSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '8px', border: 'none',
                  backgroundColor: isActive ? '#ccfbf1' : 'transparent',
                  color: isActive ? '#0d9488' : '#475569',
                  fontWeight: isActive ? '700' : '500', fontSize: '14px',
                  cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                }}
              >
                <Icon size={18} color={isActive ? '#0d9488' : '#64748b'} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px',
          border: '1px solid #e2e8f0', minHeight: '550px',
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#0d9488' }}>
              <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: '600' }}>Loading settings...</p>
            </div>
          ) : (
            <div>
              {/* 1. GENERAL */}
              {activeSection === 'general' && (
                <form onSubmit={handleSaveGeneral}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>General Clinic Settings</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Clinic Name</label>
                      <input
                        type="text"
                        value={generalData.clinic_name}
                        onChange={(e) => setGeneralData({ ...generalData, clinic_name: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Practice Type (Locked)</label>
                      <input
                        type="text"
                        value={generalData.practice_type}
                        disabled
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', marginTop: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Timezone</label>
                      <select
                        value={generalData.timezone}
                        onChange={(e) => setGeneralData({ ...generalData, timezone: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                        <option value="UTC">UTC (GMT +0:00)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Currency</label>
                      <input
                        type="text"
                        value={generalData.currency}
                        onChange={(e) => setGeneralData({ ...generalData, currency: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </form>
              )}

              {/* 2. CLINIC PROFILE */}
              {activeSection === 'clinic' && (
                <form onSubmit={handleSaveClinic}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Clinic Profile Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Phone</label>
                      <input
                        type="text"
                        value={clinicData.phone || ''}
                        onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Email</label>
                      <input
                        type="email"
                        value={clinicData.email || ''}
                        onChange={(e) => setClinicData({ ...clinicData, email: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Address</label>
                      <input
                        type="text"
                        value={clinicData.address || ''}
                        onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>City</label>
                      <input
                        type="text"
                        value={clinicData.city || ''}
                        onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>State</label>
                      <input
                        type="text"
                        value={clinicData.state || ''}
                        onChange={(e) => setClinicData({ ...clinicData, state: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Save size={16} /> Save Clinic Profile
                  </button>
                </form>
              )}

              {/* 3. WORKING HOURS */}
              {activeSection === 'working-hours' && (
                <form onSubmit={handleSaveWorkingHours}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Clinic Working Hours</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      const slot = workingHours[day] || { open: true, start: '09:00', end: '18:00' };
                      return (
                        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                          <span style={{ width: '100px', fontWeight: '700', textTransform: 'capitalize', color: '#334155' }}>{day}</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={slot.open}
                              onChange={(e) => setWorkingHours({
                                ...workingHours,
                                [day]: { ...slot, open: e.target.checked }
                              })}
                            />
                            Open
                          </label>
                          {slot.open && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...slot, start: e.target.value } })}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                              />
                              <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...slot, end: e.target.value } })}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Save size={16} /> Save Working Hours
                  </button>
                </form>
              )}

              {/* 4. DOCTOR MANAGEMENT */}
              {activeSection === 'doctors' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Doctor Management</h3>
                    <button
                      onClick={() => setShowAddDocModal(true)}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                        backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', fontSize: '13px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <Plus size={16} /> Add Doctor
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '12px', color: '#475569' }}>Doctor Name</th>
                        <th style={{ padding: '12px', color: '#475569' }}>Email</th>
                        <th style={{ padding: '12px', color: '#475569' }}>Phone</th>
                        <th style={{ padding: '12px', color: '#475569' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorsList.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{doc.name}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{doc.email}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{doc.phone}</td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => handleDeleteDoctor(doc.id)}
                              style={{ border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {showAddDocModal && (
                    <div style={{
                      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                      backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90,
                    }}>
                      <form onSubmit={handleAddDoctor} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '400px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Add New Doctor</h4>
                        <input
                          type="text" placeholder="Full Name" value={newDoc.name} required
                          onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="email" placeholder="Email" value={newDoc.email} required
                          onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="text" placeholder="Phone" value={newDoc.phone} required
                          onChange={(e) => setNewDoc({ ...newDoc, phone: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="password" placeholder="Password" value={newDoc.password} required
                          onChange={(e) => setNewDoc({ ...newDoc, password: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button type="button" onClick={() => setShowAddDocModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#0d9488', color: '#ffffff', cursor: 'pointer' }}>Add Doctor</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* 5. STAFF MANAGEMENT */}
              {activeSection === 'staff' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Staff Management</h3>
                    <button
                      onClick={() => setShowAddStaffModal(true)}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                        backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', fontSize: '13px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <Plus size={16} /> Invite Staff Member
                    </button>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '12px', color: '#475569' }}>Name</th>
                        <th style={{ padding: '12px', color: '#475569' }}>Email</th>
                        <th style={{ padding: '12px', color: '#475569' }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((st) => (
                        <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{st.name}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{st.email}</td>
                          <td style={{ padding: '12px', fontWeight: '600', color: '#0d9488', textTransform: 'capitalize' }}>
                            {st.roles?.[0]?.name?.replace('_', ' ') || 'Staff'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {showAddStaffModal && (
                    <div style={{
                      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                      backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90,
                    }}>
                      <form onSubmit={handleAddStaff} style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', width: '400px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Invite Staff Member</h4>
                        <input
                          type="text" placeholder="Full Name" value={newStaff.name} required
                          onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="email" placeholder="Email" value={newStaff.email} required
                          onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <input
                          type="text" placeholder="Phone" value={newStaff.phone} required
                          onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <select
                          value={newStaff.role}
                          onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="clinic_admin">Clinic Administrator</option>
                          <option value="doctor">Doctor</option>
                          <option value="receptionist">Front Desk / Receptionist</option>
                        </select>
                        <input
                          type="password" placeholder="Password" value={newStaff.password} required
                          onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                          style={{ width: '100%', padding: '8px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button type="button" onClick={() => setShowAddStaffModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#0d9488', color: '#ffffff', cursor: 'pointer' }}>Invite</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* 6. BILLING SETTINGS */}
              {activeSection === 'billing' && (
                <form onSubmit={handleSaveBilling}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Billing Configurations</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Invoice Prefix</label>
                      <input
                        type="text"
                        value={billingData.invoice_prefix}
                        onChange={(e) => setBillingData({ ...billingData, invoice_prefix: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Tax / GST Percentage (%)</label>
                      <input
                        type="number"
                        value={billingData.tax_percentage}
                        onChange={(e) => setBillingData({ ...billingData, tax_percentage: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Save size={16} /> Save Billing Settings
                  </button>
                </form>
              )}

              {/* 7. NOTIFICATIONS */}
              {activeSection === 'notifications' && (
                <form onSubmit={handleSaveNotifications}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Notification Preferences</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {[
                      { key: 'sms_appointment_reminder', label: 'SMS Appointment Reminders' },
                      { key: 'sms_followup_reminder', label: 'SMS Follow-up Reminders' },
                      { key: 'whatsapp_appointment', label: 'WhatsApp Appointment Confirmations' },
                      { key: 'whatsapp_prescription', label: 'WhatsApp Digital Prescription Sharing' },
                      { key: 'email_invoice', label: 'Email PDF Invoices to Patients' },
                      { key: 'queue_alerts', label: 'OPD Queue Live Alerts' },
                    ].map((item) => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{item.label}</span>
                        <input
                          type="checkbox"
                          checked={!!notifData[item.key]}
                          onChange={(e) => setNotifData({ ...notifData, [item.key]: e.target.checked })}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Save size={16} /> Save Notification Preferences
                  </button>
                </form>
              )}

              {/* 8. INTEGRATIONS */}
              {activeSection === 'integrations' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Third-Party Integrations</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {[
                      { name: 'Razorpay Payment Gateway', key: 'razorpay', status: 'Connected' },
                      { name: 'PhonePe PG', key: 'phonepe', status: 'Connected' },
                      { name: 'Meta WhatsApp Business API', key: 'whatsapp', status: 'Connected' },
                      { name: 'SMTP Email Provider', key: 'smtp', status: 'Configured' },
                    ].map((integ) => (
                      <div key={integ.key} style={{ borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{integ.name}</h4>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0d9488', backgroundColor: '#ccfbf1', padding: '2px 8px', borderRadius: '12px' }}>{integ.status}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Credentials secured and masked.</p>
                        <button style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Update API Keys</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. SECURITY */}
              {activeSection === 'security' && (
                <form onSubmit={handleChangePassword}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Security & Password</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Current Password</label>
                      <input
                        type="password"
                        value={secData.current_password}
                        onChange={(e) => setSecData({ ...secData, current_password: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>New Password</label>
                      <input
                        type="password"
                        value={secData.new_password}
                        onChange={(e) => setSecData({ ...secData, new_password: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Confirm New Password</label>
                      <input
                        type="password"
                        value={secData.new_password_confirmation}
                        onChange={(e) => setSecData({ ...secData, new_password_confirmation: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Update Password
                  </button>
                </form>
              )}

              {/* 10. PROFILE */}
              {activeSection === 'profile' && (
                <form onSubmit={handleSaveProfile}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Personal Profile</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '6px' }}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Save Profile
                  </button>
                </form>
              )}

              {/* 11. BACKUP */}
              {activeSection === 'backup' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Database Backup & Recovery</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                    Last Backup Completed: <strong>{backupInfo?.last_backup || 'N/A'}</strong>
                  </p>
                  <button
                    onClick={handleTriggerBackup}
                    disabled={saving}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <Database size={16} /> Trigger Manual Backup
                  </button>
                </div>
              )}

              {/* 12. AUDIT LOGS */}
              {activeSection === 'audit-logs' && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>System Audit Logs</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px', color: '#475569' }}>Time</th>
                        <th style={{ padding: '10px', color: '#475569' }}>User</th>
                        <th style={{ padding: '10px', color: '#475569' }}>Action</th>
                        <th style={{ padding: '10px', color: '#475569' }}>Description</th>
                        <th style={{ padding: '10px', color: '#475569' }}>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(auditLogs.data || []).map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', color: '#64748b' }}>{new Date(log.created_at).toLocaleString()}</td>
                          <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{log.user_name || 'System'}</td>
                          <td style={{ padding: '10px', fontWeight: '700', color: '#0d9488' }}>{log.action}</td>
                          <td style={{ padding: '10px', color: '#334155' }}>{log.description}</td>
                          <td style={{ padding: '10px', color: '#64748b' }}>{log.ip_address || '127.0.0.1'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
