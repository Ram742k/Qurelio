import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Search, Plus, Pill, RefreshCw, Check } from 'lucide-react';

export default function MedicineAutocomplete({ value = '', onSelect, placeholder = 'Search medicine (e.g. Dolo 650)...' }) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [creatingCustom, setCreatingCustom] = useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant debounced search trigger (80ms)
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(searchTerm);
    }, 80);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSuggestions = async (query) => {
    try {
      setLoading(true);
      const res = await api.get(`/medicines/search?q=${encodeURIComponent(query)}`);
      if (res.data?.success) {
        setResults(res.data.data || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      }
    } catch (err) {
      console.error('Error searching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMedicine = (item) => {
    setSearchTerm(item.brand_name + (item.strength ? ' ' + item.strength : ''));
    setIsOpen(false);
    if (onSelect) {
      onSelect({
        medicine_id: item.id,
        brand_name: item.brand_name,
        generic_name: item.generic_name,
        strength: item.strength,
        form: item.form,
        name: item.brand_name + (item.strength ? ' ' + item.strength : ''),
        dosage: item.strength || '',
      });
    }
  };

  const handleCreateCustom = async () => {
    if (!searchTerm.trim()) return;
    try {
      setCreatingCustom(true);
      const res = await api.post('/medicines/custom', {
        brand_name: searchTerm.trim(),
        generic_name: searchTerm.trim(),
        strength: '',
        form: 'Tablet',
      });

      if (res.data?.success && res.data?.data) {
        const customItem = res.data.data;
        handleSelectMedicine(customItem);
      }
    } catch (err) {
      alert('Failed to add custom medicine.');
    } finally {
      setCreatingCustom(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectMedicine(results[selectedIndex]);
      } else if (results.length === 0 && searchTerm.trim().length >= 2) {
        handleCreateCustom();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (onSelect) onSelect({ name: e.target.value });
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '38px',
            padding: '0 32px 0 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            fontWeight: '600',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          {loading ? <RefreshCw size={15} color="#0d9488" className="animate-spin" /> : <Search size={15} />}
        </div>
      </div>

      {/* Floating Autocomplete Suggestion Dropdown List */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '42px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0',
          zIndex: 99999,
          overflow: 'hidden',
          maxHeight: '260px',
          overflowY: 'auto',
        }}>
          {results.length > 0 ? (
            <div>
              {results.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => handleSelectMedicine(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? '#ccfbf1' : 'transparent',
                      borderLeft: isSelected ? '4px solid #0d9488' : '4px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: '#ccfbf1',
                        color: '#0d9488',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Pill size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                          {item.brand_name} <span style={{ color: '#64748b', fontWeight: '400' }}>{item.strength}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                          {item.generic_name} • {item.form}
                        </div>
                      </div>
                    </div>
                    {item.is_custom && (
                      <span style={{ fontSize: '9px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        Custom
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>No matching medicine found</div>
              <button
                type="button"
                onClick={handleCreateCustom}
                disabled={creatingCustom}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#0d9488',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {creatingCustom ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Add "{searchTerm}" as Custom Medicine
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
