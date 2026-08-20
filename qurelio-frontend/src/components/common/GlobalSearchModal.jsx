import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Search, Users, Calendar, Clock, CreditCard, FileText, X, Command, ArrowRight } from 'lucide-react';

export default function GlobalSearchModal({ isOpen, onClose, setActiveTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(null);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Instant debounced search API call (80ms)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(() => {
      fetchGlobalSearch(query);
    }, 80);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchGlobalSearch = async (q) => {
    try {
      setLoading(true);
      const res = await api.get(`/global-search?q=${encodeURIComponent(q)}`);
      if (res.data?.success) {
        setResults(res.data.data);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Flatten results for keyboard arrow navigation
  const flattenedItems = [];
  if (results) {
    if (results.patients?.length) flattenedItems.push(...results.patients);
    if (results.appointments?.length) flattenedItems.push(...results.appointments);
    if (results.queue?.length) flattenedItems.push(...results.queue);
    if (results.invoices?.length) flattenedItems.push(...results.invoices);
    if (results.prescriptions?.length) flattenedItems.push(...results.prescriptions);
  }

  const handleSelectItem = (item) => {
    if (onClose) onClose();
    if (setActiveTab && item.target_tab) {
      setActiveTab(item.target_tab);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flattenedItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedItems[selectedIndex]) {
        handleSelectItem(flattenedItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    /* Modal Backdrop Overlay */
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Centered Modal Card Container */}
      <div
        onKeyDown={handleKeyDown}
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '640px',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          padding: '16px border-bottom',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#f8fafc',
          paddingLeft: '16px',
          paddingRight: '16px',
          height: '56px',
        }}>
          <Search size={20} color="#0d9488" style={{ minWidth: '20px' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search patients, appointments, tokens, invoices, prescriptions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              fontWeight: '600',
              color: '#0f172a',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
          )}
          <kbd style={{
            fontSize: '10px',
            fontWeight: '700',
            color: '#64748b',
            backgroundColor: '#e2e8f0',
            padding: '3px 7px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results Scroll Container */}
        <div style={{ overflowY: 'auto', padding: '12px', flex: 1 }}>
          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>
              Searching clinic records...
            </div>
          )}

          {!loading && !results && (
            <div style={{ padding: '36px', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundColor: '#ccfbf1',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Command size={24} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Qurelio Global Command Palette</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Type at least 2 characters to search across Patients, Appointments, OPD Tokens, Invoices, and Prescriptions.
              </p>
            </div>
          )}

          {!loading && results && flattenedItems.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
              No matching clinic records found for "{query}".
            </div>
          )}

          {!loading && results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Category 1: Patients */}
              {results.patients?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '0 8px 6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="#0d9488" /> Patients ({results.patients.length})
                  </div>
                  {results.patients.map((p) => {
                    const globalIdx = flattenedItems.findIndex((i) => i.type === 'patient' && i.id === p.id);
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <div
                        key={`patient-${p.id}`}
                        onClick={() => handleSelectItem(p)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? '#ccfbf1' : 'transparent',
                          borderLeft: isSelected ? '4px solid #0d9488' : '4px solid transparent',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{p.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.subtitle}</div>
                        </div>
                        <ArrowRight size={15} color="#0d9488" style={{ opacity: isSelected ? 1 : 0 }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category 2: Appointments */}
              {results.appointments?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '0 8px 6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#2563eb" /> Appointments ({results.appointments.length})
                  </div>
                  {results.appointments.map((a) => {
                    const globalIdx = flattenedItems.findIndex((i) => i.type === 'appointment' && i.id === a.id);
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <div
                        key={`appt-${a.id}`}
                        onClick={() => handleSelectItem(a)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                          borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{a.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{a.subtitle}</div>
                        </div>
                        <ArrowRight size={15} color="#2563eb" style={{ opacity: isSelected ? 1 : 0 }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category 3: Queue Tokens */}
              {results.queue?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '0 8px 6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#4f46e5" /> OPD Queue ({results.queue.length})
                  </div>
                  {results.queue.map((q) => {
                    const globalIdx = flattenedItems.findIndex((i) => i.type === 'queue' && i.id === q.id);
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <div
                        key={`queue-${q.id}`}
                        onClick={() => handleSelectItem(q)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? '#e0e7ff' : 'transparent',
                          borderLeft: isSelected ? '4px solid #4f46e5' : '4px solid transparent',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{q.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{q.subtitle}</div>
                        </div>
                        <ArrowRight size={15} color="#4f46e5" style={{ opacity: isSelected ? 1 : 0 }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category 4: Invoices */}
              {results.invoices?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '0 8px 6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={14} color="#16a34a" /> Invoices ({results.invoices.length})
                  </div>
                  {results.invoices.map((inv) => {
                    const globalIdx = flattenedItems.findIndex((i) => i.type === 'invoice' && i.id === inv.id);
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <div
                        key={`inv-${inv.id}`}
                        onClick={() => handleSelectItem(inv)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? '#dcfce7' : 'transparent',
                          borderLeft: isSelected ? '4px solid #16a34a' : '4px solid transparent',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{inv.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{inv.subtitle}</div>
                        </div>
                        <ArrowRight size={15} color="#16a34a" style={{ opacity: isSelected ? 1 : 0 }} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category 5: Prescriptions */}
              {results.prescriptions?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '0 8px 6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="#9333ea" /> Prescriptions ({results.prescriptions.length})
                  </div>
                  {results.prescriptions.map((rx) => {
                    const globalIdx = flattenedItems.findIndex((i) => i.type === 'prescription' && i.id === rx.id);
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <div
                        key={`rx-${rx.id}`}
                        onClick={() => handleSelectItem(rx)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? '#f3e8ff' : 'transparent',
                          borderLeft: isSelected ? '4px solid #9333ea' : '4px solid transparent',
                          marginBottom: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{rx.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{rx.subtitle}</div>
                        </div>
                        <ArrowRight size={15} color="#9333ea" style={{ opacity: isSelected ? 1 : 0 }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Keyboard Navigation Shortcuts Helper */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b',
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd style={{ padding: '1px 5px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}>↑</kbd> <kbd style={{ padding: '1px 5px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}>↓</kbd> Navigate</span>
            <span><kbd style={{ padding: '1px 5px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700' }}>↵</kbd> Select</span>
          </div>
          <span style={{ fontWeight: '700', color: '#0d9488' }}>Qurelio Health Command Palette</span>
        </div>
      </div>
    </div>
  );
}
