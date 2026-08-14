import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  X, 
  Calendar, 
  Phone, 
  FileText, 
  Plus, 
  Stethoscope, 
  Receipt, 
  FilePlus, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  UserCheck
} from 'lucide-react';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    medical_history: '',
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { search } });
      const data = res.data.data || [];
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        setSelectedPatient(data[0]);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender,
        phone: form.phone,
        medical_history: form.medical_history ? { notes: form.medical_history } : null,
      };

      const res = await api.post('/patients', payload);
      setForm({ name: '', age: '', gender: 'male', phone: '', medical_history: '' });
      setShowForm(false);
      fetchPatients();
      if (res.data) {
        setSelectedPatient(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Error adding patient: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)', backgroundColor: '#f8fafc' }}>
      
      {/* Left Sub-Sidebar / Filter Panel matching design */}
      <div style={{
        width: '240px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
            Patients
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Patients', count: patients.length || '1,248' },
              { id: 'today', label: "Today's Patients", count: '10' },
              { id: 'recent', label: 'Recently Visited', count: '26' },
              { id: 'new', label: 'New Patients', count: '32' },
            ].map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#0d9488' : '#475569',
                    backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                    borderLeft: isActive ? '3px solid #0d9488' : '3px solid transparent',
                  }}
                >
                  <span>{f.label}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isActive ? '#0d9488' : '#94a3b8',
                    backgroundColor: isActive ? '#ccfbf1' : '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Decorative Card matching design */}
        <div style={{
          marginTop: 'auto',
          padding: '16px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%)',
          border: '1px solid #99f6e4',
          textAlign: 'center',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#0d9488',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto',
          }}>
            <UserCheck size={20} />
          </div>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f766e', lineHeight: 1.3 }}>
            Care begins with knowing your patients
          </p>
        </div>
      </div>

      {/* Center Patient Listing */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Top Control Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {/* Search Box */}
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
            <input
              type="text"
              placeholder="Search patients by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Add Patient Button */}
          <button
            onClick={() => setShowForm(true)}
            style={{
              height: '42px',
              padding: '0 20px',
              borderRadius: '10px',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
            }}
          >
            <UserPlus size={18} />
            <span>+ Add Patient</span>
          </button>
        </div>

        {/* Patient Cards List */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p>Loading patient records...</p>
          </div>
        ) : patients.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '48px',
            textAlign: 'center',
          }}>
            <h4 style={{ fontSize: '16px', color: '#334155', marginBottom: '8px' }}>No patients found</h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Try searching with a different term or add a new patient.</p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#0d9488',
                color: '#fff',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              + Create Patient
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {patients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #0d9488' : '1px solid #e2e8f0',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Patient Avatar */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#0d9488' : '#e0f2fe',
                      color: isSelected ? '#ffffff' : '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '15px',
                    }}>
                      {initials}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {p.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        PT-{1000 + p.id} &bull; {p.age ? `${p.age} yrs` : 'N/A'} &bull; <span style={{ textTransform: 'capitalize' }}>{p.gender || 'Other'}</span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Phone</p>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{p.phone}</p>
                    </div>
                    <ChevronRight size={18} color={isSelected ? '#0d9488' : '#cbd5e1'} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Patient Detail Panel matching design */}
      {selectedPatient && (
        <div style={{
          width: '380px',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 72px)',
        }} className="animate-slide-in">
          
          {/* Header Banner Card */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            padding: '20px',
            color: '#ffffff',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '18px',
              }}>
                {selectedPatient.name ? selectedPatient.name.substring(0, 2).toUpperCase() : 'PT'}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                  {selectedPatient.name}
                </h3>
                <span style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#2dd4bf',
                  marginTop: '2px',
                }}>
                  PT-{1000 + selectedPatient.id}
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid #334155',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
            }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Age / Gender:</span>
                <p style={{ fontWeight: '600', color: '#f8fafc', marginTop: '2px', textTransform: 'capitalize' }}>
                  {selectedPatient.age || 'N/A'} yrs &bull; {selectedPatient.gender || 'N/A'}
                </p>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Phone:</span>
                <p style={{ fontWeight: '600', color: '#f8fafc', marginTop: '2px' }}>
                  {selectedPatient.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Buttons matching reference design */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Actions
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}>
                <Calendar size={14} />
                <span>Book Appt</span>
              </button>
              <button style={{
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
              }}>
                <FilePlus size={14} />
                <span>Prescription</span>
              </button>
            </div>
          </div>

          {/* Medical Summary Details */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '16px',
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Medical Summary
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Blood Group:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>O+</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Allergies:</span>
                <span style={{ fontWeight: '600', color: '#ef4444' }}>
                  {selectedPatient.medical_history?.allergies ? selectedPatient.medical_history.allergies.join(', ') : 'None Reported'}
                </span>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Medical Notes:</span>
                <p style={{ color: '#334155', lineHeight: 1.4 }}>
                  {selectedPatient.medical_history?.notes || 'No recent medical notes recorded for this patient.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px',
        }} className="animate-fade-in">
          
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Add New Patient
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAdd} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Patient Full Name *
                </label>
                <input
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Age
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 35"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Phone Number *
                </label>
                <input
                  placeholder="e.g. 9840000000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Medical History / Notes
                </label>
                <textarea
                  placeholder="e.g. Hypertension, Diabetes, Allergies..."
                  rows={3}
                  value={form.medical_history}
                  onChange={(e) => setForm({ ...form, medical_history: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                  }}
                >
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
