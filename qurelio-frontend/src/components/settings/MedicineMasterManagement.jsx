import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Pill, Search, Plus, Edit2, CheckCircle, XCircle, RefreshCw, X, Save } from 'lucide-react';

export default function MedicineMasterManagement() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [customFilter, setCustomFilter] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    brand_name: '',
    generic_name: '',
    strength: '',
    form: 'Tablet',
    unit: 'mg',
    manufacturer: '',
  });

  useEffect(() => {
    fetchMedicines();
  }, [search, formFilter, customFilter]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (formFilter) params.form = formFilter;
      if (customFilter) params.custom_only = 'true';

      const res = await api.get('/medicines', { params });
      if (res.data?.success) {
        setMedicines(res.data.data?.data || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormData({
      brand_name: '',
      generic_name: '',
      strength: '',
      form: 'Tablet',
      unit: 'mg',
      manufacturer: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setFormData({
      brand_name: med.brand_name || '',
      generic_name: med.generic_name || '',
      strength: med.strength || '',
      form: med.form || 'Tablet',
      unit: med.unit || 'mg',
      manufacturer: med.manufacturer || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingMed) {
        await api.put(`/medicines/${editingMed.id}`, formData);
      } else {
        await api.post('/medicines', formData);
      }
      setModalOpen(false);
      fetchMedicines();
    } catch (err) {
      alert('Failed to save medicine details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (med) => {
    try {
      if (med.is_active) {
        await api.delete(`/medicines/${med.id}`);
      } else {
        await api.put(`/medicines/${med.id}`, { is_active: true });
      }
      fetchMedicines();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
      {/* Header Title & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Pill size={20} color="#0d9488" />
            Medicine Master Catalog
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage clinic drug inventory, dosage strengths, and custom added medicines.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            backgroundColor: '#0d9488',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '12px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.2)',
          }}
        >
          <Plus size={16} /> Add New Medicine
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search brand or generic name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 36px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: '600',
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
        </div>

        <select
          value={formFilter}
          onChange={(e) => setFormFilter(e.target.value)}
          style={{
            height: '38px',
            padding: '0 12px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            fontSize: '12px',
            fontWeight: '600',
            color: '#334155',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}
        >
          <option value="">All Dosage Forms</option>
          <option value="Tablet">Tablet</option>
          <option value="Capsule">Capsule</option>
          <option value="Syrup">Syrup</option>
          <option value="Injection">Injection</option>
          <option value="Ointment">Ointment</option>
          <option value="Drops">Drops</option>
          <option value="Sachet">Sachet</option>
        </select>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#334155',
          cursor: 'pointer',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '0 12px',
          height: '38px',
          boxSizing: 'border-box',
        }}>
          <input
            type="checkbox"
            checked={customFilter}
            onChange={(e) => setCustomFilter(e.target.checked)}
            style={{ accentColor: '#0d9488' }}
          />
          Custom Added Only
        </label>
      </div>

      {/* Styled Medicines Table */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#0d9488' }}>
          <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Loading medicine database...</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Brand Name</th>
                <th style={{ padding: '12px 16px' }}>Generic Composition</th>
                <th style={{ padding: '12px 16px' }}>Strength</th>
                <th style={{ padding: '12px 16px' }}>Form</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>{med.brand_name}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{med.generic_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0d9488' }}>{med.strength || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                      {med.form}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {med.is_custom ? (
                      <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        Custom
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        Standard
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {med.is_active ? (
                      <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontWeight: '700', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={14} /> Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', items: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(med)}
                        style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                        title="Edit Medicine"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(med)}
                        style={{
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          backgroundColor: med.is_active ? '#fee2e2' : '#dcfce7',
                          color: med.is_active ? '#dc2626' : '#15803d',
                        }}
                      >
                        {med.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Fixed Modal Dialog Popup */}
      {modalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                {editingMed ? 'Edit Medicine Entry' : 'Add New Medicine to Catalog'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dolo"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Generic Name / Active Composition *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol"
                  value={formData.generic_name}
                  onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Strength
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 650 mg"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Dosage Form
                  </label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="Sachet">Sachet</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Manufacturer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Micro Labs"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0d9488', color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={15} /> {submitting ? 'Saving...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
