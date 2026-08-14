import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  User,
  Phone,
  ArrowUpRight,
  Clock,
  QrCode,
  Wallet,
  ShieldCheck,
  Smartphone,
  Check,
  RotateCw,
} from 'lucide-react';

const STATUS_CONFIG = {
  paid:     { label: 'Paid',     bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  pending:  { label: 'Pending',  bg: '#fef9c3', color: '#a16207', border: '#fde047' },
  partial:  { label: 'Partial',  bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  refunded: { label: 'Refunded', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: '700',
      padding: '3px 10px',
      borderRadius: '20px',
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function Billing() {
  const [invoices, setInvoices]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [apiError, setApiError]               = useState(null);
  const [patients, setPatients]               = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');

  // Modal create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm]           = useState({
    patient_id: '',
    amount: '',
    payment_method: 'cash',
    status: 'pending',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError]           = useState(null);

  // Modal payment
  const [showPayModal, setShowPayModal]   = useState(false);
  const [payInvoice, setPayInvoice]       = useState(null);
  const [payMethod, setPayMethod]         = useState('razorpay'); // 'razorpay' | 'phonepe' | 'cash' | 'upi' | 'card' | 'insurance'
  const [paying, setPaying]               = useState(false);
  const [payResult, setPayResult]         = useState(null); // { type: 'success'|'error'|'pending', message, txId, amount }

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/invoices', { params });
      const list = res.data?.data?.data || res.data?.data || [];
      setInvoices(Array.isArray(list) ? list : []);
    } catch (err) {
      setApiError('Failed to load invoices. Please try again.');
    }
    setLoading(false);
  }, [filterStatus, search]);

  // Fetch patients for invoice creation
  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/patients', { params: { per_page: 200 } });
      const list = res.data?.data?.data || res.data?.data || [];
      setPatients(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  // Handle Create Invoice
  async function handleCreateInvoice(e) {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);
    try {
      await api.post('/invoices', {
        patient_id: parseInt(createForm.patient_id),
        amount: parseFloat(createForm.amount),
        payment_method: createForm.payment_method,
        status: createForm.status,
      });

      setShowCreateModal(false);
      setCreateForm({ patient_id: '', amount: '', payment_method: 'cash', status: 'pending' });
      fetchInvoices();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create invoice.');
    }
    setFormSubmitting(false);
  }

  // Handle Online & Manual Payment Processing
  async function handleProcessPayment() {
    if (!payInvoice) return;
    setPaying(true);
    setPayResult(null);

    try {
      if (payMethod === 'razorpay') {
        // Step 1: Start Razorpay payment order via backend API
        const orderRes = await api.post(`/invoices/${payInvoice.id}/online-payment`, { gateway: 'razorpay' });
        const { payment_id, data } = orderRes.data;

        if (window.Razorpay && !data.sandbox) {
          const options = {
            key: data.key,
            amount: Math.round(data.amount * 100),
            currency: 'INR',
            name: 'Qurelio Clinic Management',
            description: `Invoice #${payInvoice.invoice_number}`,
            order_id: data.order_id,
            handler: async function (response) {
              try {
                // Step 2: Server-side signature verification
                const verifyRes = await api.post(`/invoices/${payInvoice.id}/verify`, {
                  payment_id: payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

                if (verifyRes.data.success) {
                  setPayResult({
                    type: 'success',
                    message: 'Razorpay Payment Successful!',
                    txId: response.razorpay_payment_id,
                    amount: data.amount,
                  });
                  setTimeout(() => { fetchInvoices(); }, 1000);
                } else {
                  setPayResult({ type: 'error', message: 'Razorpay Signature Verification Failed.' });
                }
              } catch (err) {
                setPayResult({ type: 'error', message: err.response?.data?.message || 'Server verification failed.' });
              }
            },
            prefill: {
              name: payInvoice.patient?.name,
              contact: payInvoice.patient?.phone,
            },
            theme: { color: '#0d9488' },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Test Sandbox mode verification
          const mockPaymentId = 'pay_rzp_mock_' + Math.random().toString(36).substring(2, 9);
          const verifyRes = await api.post(`/invoices/${payInvoice.id}/verify`, {
            payment_id: payment_id,
            razorpay_order_id: data.order_id,
            razorpay_payment_id: mockPaymentId,
          });

          setPayResult({
            type: 'success',
            message: 'Payment Verified via Razorpay Sandbox!',
            txId: mockPaymentId,
            amount: data.amount,
          });
          setTimeout(() => { fetchInvoices(); }, 1000);
        }
      } else if (payMethod === 'phonepe') {
        // PhonePe Gateway Flow
        const orderRes = await api.post(`/invoices/${payInvoice.id}/online-payment`, { gateway: 'phonepe' });
        const { payment_id, data } = orderRes.data;

        if (data.redirect_url && !data.sandbox) {
          window.open(data.redirect_url, '_blank');
          setPayResult({
            type: 'pending',
            message: 'PhonePe Checkout launched in new tab. Verify transaction status below.',
            txId: data.transaction_id,
            paymentId: payment_id,
          });
        } else {
          // PhonePe Sandbox auto-verification
          const verifyRes = await api.post(`/invoices/${payInvoice.id}/verify`, {
            payment_id: payment_id,
            merchantTransactionId: data.transaction_id,
          });

          setPayResult({
            type: 'success',
            message: 'Payment Verified via PhonePe Gateway!',
            txId: data.transaction_id,
            amount: data.amount,
          });
          setTimeout(() => { fetchInvoices(); }, 1000);
        }
      } else {
        // Direct Offline Method (Cash, UPI QR, Card, Insurance)
        await api.put(`/invoices/${payInvoice.id}`, {
          status: 'paid',
          payment_method: payMethod,
        });
        setPayResult({
          type: 'success',
          message: `Payment recorded via ${payMethod.toUpperCase()}!`,
          txId: 'MANUAL_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          amount: payInvoice.amount,
        });
        setTimeout(() => { fetchInvoices(); }, 1000);
      }
    } catch (err) {
      setPayResult({
        type: 'error',
        message: err.response?.data?.message || 'Payment initiation failed. Please check credentials or try again.',
      });
    }
    setPaying(false);
  }

  // Summary Metrics
  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  const pendingAmount = invoices
    .filter(i => ['pending', 'partial'].includes(i.status))
    .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  return (
    <div style={{ padding: '28px 32px', backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 72px)' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Billing & Payments 💳
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Manage clinic billing and collect payments via Razorpay & PhonePe.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            height: '42px', padding: '0 20px', borderRadius: '10px',
            backgroundColor: '#0d9488', color: '#ffffff',
            fontSize: '14px', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
          }}
        >
          <Plus size={18} />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* ── Top Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid Revenue</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', marginTop: '6px' }}>{formatCurrency(totalRevenue)}</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Amount</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#a16207', marginTop: '6px' }}>{formatCurrency(pendingAmount)}</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Invoices</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{invoices.length}</p>
        </div>
      </div>

      {/* ── Control Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
          <input
            type="text"
            placeholder="Search by invoice number or patient name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '14px' }}
          />
        </div>

        {/* Status filter dropdown */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ height: '42px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', padding: '0 14px', fontSize: '13px', color: '#475569' }}
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="refunded">Refunded</option>
        </select>

        <button
          onClick={fetchInvoices}
          style={{ height: '42px', width: '42px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Invoice List Table ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px' }}>Loading invoices...</p>
          </div>
        ) : apiError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
            <p>{apiError}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '16px', color: '#334155', marginBottom: '8px' }}>No invoices found</h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Create a new invoice to record patient billing.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} /> Create Invoice
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Invoice #</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Patient</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Amount</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Payment Method</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, idx) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0d9488' }}>
                    {inv.invoice_number}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <p style={{ fontWeight: '700', color: '#0f172a' }}>{inv.patient?.name || '—'}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>{inv.patient?.phone || ''}</p>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: '800', color: '#0f172a' }}>
                    {formatCurrency(inv.amount)}
                  </td>
                  <td style={{ padding: '14px 20px', textTransform: 'uppercase', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                    {inv.payment_method || '—'}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '12px' }}>
                    {formatDate(inv.created_at)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {['pending', 'partial'].includes(inv.status) ? (
                      <button
                        onClick={() => { setPayInvoice(inv); setShowPayModal(true); setPayResult(null); }}
                        style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: '#0d9488', color: '#fff', fontSize: '12px', fontWeight: '600' }}
                      >
                        Collect Payment
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Paid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Invoice Modal ── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Create Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '13px' }}>
                  {formError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Patient *</label>
                <select
                  required
                  value={createForm.patient_id}
                  onChange={e => setCreateForm({ ...createForm, patient_id: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 500"
                  value={createForm.amount}
                  onChange={e => setCreateForm({ ...createForm, amount: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Payment Method</label>
                <select
                  value={createForm.payment_method}
                  onChange={e => setCreateForm({ ...createForm, payment_method: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="razorpay">Razorpay Gateway</option>
                  <option value="phonepe">PhonePe Gateway</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Initial Status</label>
                <select
                  value={createForm.status}
                  onChange={e => setCreateForm({ ...createForm, status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, height: '42px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={formSubmitting} style={{ flex: 1, height: '42px', borderRadius: '10px', backgroundColor: '#0d9488', color: '#fff', fontWeight: '600' }}>
                  {formSubmitting ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Collect Payment Gateway Modal ── */}
      {showPayModal && payInvoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Online Payment Gateway</h3>
                <p style={{ fontSize: '12px', color: '#0d9488', fontWeight: '700', marginTop: '2px' }}>{payInvoice.invoice_number}</p>
              </div>
              <button onClick={() => setShowPayModal(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Result Notification UI */}
              {payResult && (
                <div style={{
                  padding: '14px', borderRadius: '12px',
                  backgroundColor: payResult.type === 'success' ? '#dcfce7' : payResult.type === 'pending' ? '#fef9c3' : '#fee2e2',
                  border: `1px solid ${payResult.type === 'success' ? '#86efac' : payResult.type === 'pending' ? '#fde047' : '#fca5a5'}`,
                  color: payResult.type === 'success' ? '#15803d' : payResult.type === 'pending' ? '#a16207' : '#b91c1c',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px' }}>
                    {payResult.type === 'success' && <CheckCircle2 size={18} />}
                    {payResult.type === 'pending' && <Clock size={18} />}
                    {payResult.type === 'error' && <AlertCircle size={18} />}
                    <span>{payResult.message}</span>
                  </div>
                  {payResult.txId && (
                    <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.9 }}>
                      Transaction ID: <strong>{payResult.txId}</strong>
                    </p>
                  )}
                  {payResult.type === 'error' && (
                    <button
                      onClick={handleProcessPayment}
                      style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#dc2626', color: '#fff', fontSize: '12px', fontWeight: '600' }}
                    >
                      Retry Payment
                    </button>
                  )}
                </div>
              )}

              {/* Amount Display Card */}
              <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #99f6e4', padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#0f766e', fontWeight: '600' }}>Amount Payable</p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#0d9488', marginTop: '2px' }}>{formatCurrency(payInvoice.amount)}</p>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Patient: <strong>{payInvoice.patient?.name}</strong></p>
              </div>

              {/* Gateway & Payment Method Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Choose Payment Gateway / Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'razorpay', label: 'Razorpay Gateway', icon: ShieldCheck, badge: 'Popular' },
                    { id: 'phonepe', label: 'PhonePe Gateway', icon: Smartphone, badge: 'UPI' },
                    { id: 'cash', label: 'Cash', icon: DollarSign },
                    { id: 'upi', label: 'Offline UPI QR', icon: QrCode },
                    { id: 'card', label: 'POS Card', icon: CreditCard },
                    { id: 'insurance', label: 'Insurance', icon: Wallet },
                  ].map(({ id, label, icon: Icon, badge }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPayMethod(id)}
                      style={{
                        padding: '12px 10px', borderRadius: '10px',
                        border: payMethod === id ? '2px solid #0d9488' : '1px solid #e2e8f0',
                        backgroundColor: payMethod === id ? '#f0fdf4' : '#fff',
                        color: payMethod === id ? '#0d9488' : '#475569',
                        fontSize: '12px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={paying || (payResult && payResult.type === 'success')}
                style={{
                  height: '44px', borderRadius: '10px',
                  backgroundColor: paying ? '#99f6e4' : '#0d9488',
                  color: '#fff', fontWeight: '700', fontSize: '14px',
                  marginTop: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {paying ? (
                  <><RotateCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Processing Gateway...</>
                ) : payMethod === 'razorpay' ? (
                  'Pay via Razorpay Checkout'
                ) : payMethod === 'phonepe' ? (
                  'Pay via PhonePe'
                ) : (
                  'Record Offline Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
