import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Download,
  RefreshCw,
  Filter,
  CheckCircle2,
  FileText,
  UserCheck,
  CreditCard,
  Search,
  PieChart as PieIcon,
  Activity,
  Award,
} from 'lucide-react';

export default function Reports() {
  const [preset, setPreset] = useState('last_30_days');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & Cache states
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [doctorPerfData, setDoctorPerfData] = useState([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Reset cached tab data when filters change
    setRevenueData(null);
    setAppointmentData(null);
    setPatientData(null);
    setPrescriptionData(null);
    setPaymentData(null);
    setQueueData(null);
    setDoctorPerfData([]);

    fetchDashboard();
    fetchTabData(activeTab);
  }, [preset, fromDate, toDate, selectedDoctor]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      if (res.data?.data) {
        setDoctorsList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  const getQueryParams = () => ({
    preset,
    from: preset === 'custom' ? fromDate : undefined,
    to: preset === 'custom' ? toDate : undefined,
    doctor_id: selectedDoctor || undefined,
  });

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await api.get('/reports/dashboard', { params: getQueryParams() });
      setDashboardData(res.data?.data);
    } catch (err) {
      console.error('Failed to load dashboard report', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchTabData = async (tab) => {
    const params = getQueryParams();

    if (tab === 'overview' || tab === 'revenue') {
      if (revenueData && appointmentData) return;
      setTabLoading(true);
      try {
        const [revRes, apptRes] = await Promise.all([
          revenueData ? Promise.resolve({ data: { data: revenueData } }) : api.get('/reports/revenue', { params }),
          appointmentData ? Promise.resolve({ data: { data: appointmentData } }) : api.get('/reports/appointments', { params }),
        ]);
        setRevenueData(revRes.data?.data);
        setAppointmentData(apptRes.data?.data);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setTabLoading(false);
      }
    } else if (tab === 'appointments') {
      if (appointmentData) return;
      setTabLoading(true);
      try {
        const apptRes = await api.get('/reports/appointments', { params });
        setAppointmentData(apptRes.data?.data);
      } catch (err) {
        console.error('Failed to load appointment report', err);
      } finally {
        setTabLoading(false);
      }
    } else if (tab === 'patients') {
      if (patientData && prescriptionData) return;
      setTabLoading(true);
      try {
        const [patRes, rxRes] = await Promise.all([
          patientData ? Promise.resolve({ data: { data: patientData } }) : api.get('/reports/patients', { params }),
          prescriptionData ? Promise.resolve({ data: { data: prescriptionData } }) : api.get('/reports/prescriptions', { params }),
        ]);
        setPatientData(patRes.data?.data);
        setPrescriptionData(rxRes.data?.data);
      } catch (err) {
        console.error('Failed to load patient report', err);
      } finally {
        setTabLoading(false);
      }
    } else if (tab === 'queue') {
      if (doctorPerfData.length > 0) return;
      setTabLoading(true);
      try {
        const [qRes, docRes] = await Promise.all([
          queueData ? Promise.resolve({ data: { data: queueData } }) : api.get('/reports/queue', { params }),
          doctorPerfData.length > 0 ? Promise.resolve({ data: { data: doctorPerfData } }) : api.get('/reports/doctor-performance', { params }),
        ]);
        setQueueData(qRes.data?.data);
        setDoctorPerfData(docRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load doctor performance report', err);
      } finally {
        setTabLoading(false);
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/reports/export?format=csv&type=${activeTab}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Qurelio_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report.');
    }
  };

  const renderKpiCards = () => {
    if (!dashboardData) return null;

    const cards = [
      { title: 'Total Revenue', value: `₹${(dashboardData.total_revenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: '#0d9488', bg: '#ccfbf1' },
      { title: 'Total Appointments', value: dashboardData.total_appointments || 0, icon: Calendar, color: '#0284c7', bg: '#e0f2fe' },
      { title: 'Completed Visits', value: dashboardData.completed_visits || 0, icon: CheckCircle2, color: '#16a34a', bg: '#dcfce7' },
      { title: 'New Patients', value: dashboardData.new_patients || 0, icon: Users, color: '#8b5cf6', bg: '#f3e8ff' },
      { title: 'Pending Payments', value: `₹${(dashboardData.pending_payments || 0).toLocaleString('en-IN')}`, icon: CreditCard, color: '#ea580c', bg: '#ffedd5' },
      { title: 'Queue Efficiency', value: `${dashboardData.queue_efficiency || 100}%`, icon: Activity, color: '#2563eb', bg: '#dbeafe' },
      { title: 'Avg Consult Time', value: `${dashboardData.avg_consultation_time || 15} min`, icon: Clock, color: '#d97706', bg: '#fef3c7' },
      { title: 'Follow-up Rate', value: `${dashboardData.follow_up_rate || 0}%`, icon: UserCheck, color: '#059669', bg: '#ecfdf5' },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} style={{
              backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.title}</p>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{c.value}</h3>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                backgroundColor: c.bg, color: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrendChart = (data = [], key = 'total', color = '#0d9488', title = 'Trend') => {
    if (!data || data.length === 0) {
      return (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          No trend data recorded for selected range.
        </div>
      );
    }

    const maxVal = Math.max(...data.map(d => d[key] || 0), 10);
    const height = 180;
    const width = 600;
    const padding = 20;

    const points = data.map((d, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((d[key] || 0) / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>{title}</h4>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '200px', overflow: 'visible' }}>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, index) => {
            const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
            const y = height - padding - ((d[key] || 0) / maxVal) * (height - padding * 2);
            return (
              <circle key={index} cx={x} cy={y} r="4" fill="#ffffff" stroke={color} strokeWidth="2">
                <title>{`${d.date}: ${d[key]}`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>Reports & Analytics</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>Monitor clinic performance with real-time insights and data analytics.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600', color: '#334155', cursor: 'pointer',
            }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {preset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
          )}

          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '500', color: '#334155', cursor: 'pointer',
            }}
          >
            <option value="">All Doctors</option>
            {doctorsList.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setRevenueData(null); setAppointmentData(null); setPatientData(null);
              fetchDashboard(); fetchTabData(activeTab);
            }}
            title="Refresh Data"
            style={{
              padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <RefreshCw size={16} className={loadingDashboard || tabLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '600', fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(13,148,136,0.25)',
            }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {renderKpiCards()}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue & Payments', icon: DollarSign },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'patients', label: 'Patients & Rx', icon: Users },
          { id: 'queue', label: 'Queue & Doctor Performance', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                border: 'none', borderBottom: isActive ? '3px solid #0d9488' : '3px solid transparent',
                backgroundColor: 'transparent', color: isActive ? '#0d9488' : '#64748b',
                fontWeight: isActive ? '700' : '600', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#0d9488' }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: '600' }}>Loading report details...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                {renderTrendChart(revenueData?.trend || [], 'total', '#0d9488', 'Daily Revenue Trend (₹)')}
              </div>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                {renderTrendChart(appointmentData?.daily_trend || [], 'total', '#0284c7', 'Daily Appointments Volume')}
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                {renderTrendChart(revenueData?.trend || [], 'total', '#0d9488', 'Revenue Growth Trend')}
              </div>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Payment Methods Distribution</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {Object.entries(revenueData?.payment_methods_breakdown || {}).map(([method, amount]) => (
                    <div key={method} style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', color: '#64748b' }}>{method}</p>
                      <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>₹{amount.toLocaleString('en-IN')}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Doctor Appointment Breakdown</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px', color: '#475569' }}>Doctor Name</th>
                    <th style={{ padding: '12px', color: '#475569' }}>Total Appointments</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(appointmentData?.doctor_breakdown || {}).map(([docName, count]) => (
                    <tr key={docName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>{docName}</td>
                      <td style={{ padding: '12px', color: '#0d9488', fontWeight: '700' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'patients' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Top Prescribed Medicines</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px', color: '#475569' }}>Medicine Name</th>
                      <th style={{ padding: '10px', color: '#475569' }}>Prescriptions Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(prescriptionData?.top_medicines || []).map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: '600', color: '#0f172a' }}>{m.name}</td>
                        <td style={{ padding: '10px', color: '#0d9488', fontWeight: '700' }}>{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Patient Age Distribution</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(patientData?.age_distribution || {}).map(([range, count]) => (
                    <div key={range}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                        <span>Age {range}</span>
                        <span>{count} patients</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (count / Math.max(patientData?.total_registered || 1, 1)) * 100)}%`, height: '100%', backgroundColor: '#0d9488', borderRadius: '5px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Doctor Performance Leaderboard</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px', color: '#475569' }}>Rank</th>
                    <th style={{ padding: '12px', color: '#475569' }}>Doctor Name</th>
                    <th style={{ padding: '12px', color: '#475569' }}>Patients Seen</th>
                    <th style={{ padding: '12px', color: '#475569' }}>Revenue (₹)</th>
                    <th style={{ padding: '12px', color: '#475569' }}>Prescriptions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorPerfData.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '800', color: '#0d9488' }}>#{doc.rank}</td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>{doc.name}</td>
                      <td style={{ padding: '12px', color: '#334155' }}>{doc.patients_seen}</td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#16a34a' }}>₹{doc.revenue_generated.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', color: '#334155' }}>{doc.prescriptions_issued}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
