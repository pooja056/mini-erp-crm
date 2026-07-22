import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Challan, Customer, Product, Pagination } from '../types';
import { Modal } from '../components/Modal';
import { ChallanPdfModal } from '../components/ChallanPdfModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Search, FileText, CheckCircle, XCircle, Trash2, Printer, AlertCircle, Download } from 'lucide-react';
import { exportToCsv } from '../utils/exportCsv';

export const ChallansPage: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // PDF Preview Modal State
  const [pdfChallan, setPdfChallan] = useState<Challan | null>(null);

  // Create Challan Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanItems, setChallanItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [challanStatus, setChallanStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: debouncedSearch,
        status: statusFilter,
      }).toString();

      const res = await api.get<{ challans: Challan[]; pagination: Pagination }>(`/challans?${query}`);
      setChallans(res.challans || []);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to fetch challans:', err);
      toast('Failed to load challans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [page, debouncedSearch, statusFilter]);

  const openCreateChallanModal = async () => {
    setCreateError('');
    setSelectedCustomerId('');
    setChallanItems([{ productId: '', quantity: 1 }]);
    setChallanStatus('DRAFT');
    setIsCreateModalOpen(true);

    try {
      const [cRes, pRes] = await Promise.all([
        api.get<{ customers: Customer[] }>('/customers?limit=100'),
        api.get<{ products: Product[] }>('/products?limit=100'),
      ]);
      setCustomersList(cRes.customers || []);
      setProductsList(pRes.products || []);
    } catch (err) {
      console.error('Failed to load customers or products for challan form:', err);
    }
  };

  const addItemRow = () => {
    setChallanItems([...challanItems, { productId: '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (challanItems.length <= 1) return;
    const updated = challanItems.filter((_, i) => i !== index);
    setChallanItems(updated);
  };

  const updateItemRow = (index: number, field: 'productId' | 'quantity', val: any) => {
    const updated = [...challanItems];
    updated[index] = { ...updated[index], [field]: val };
    setChallanItems(updated);
  };

  // Calculate live preview subtotal
  const calculateTotal = () => {
    let qty = 0;
    let amount = 0;
    const productMap = new Map(productsList.map((p) => [p.id, p]));

    for (const item of challanItems) {
      if (item.productId) {
        const prod = productMap.get(item.productId);
        if (prod) {
          qty += item.quantity;
          amount += prod.unitPrice * item.quantity;
        }
      }
    }
    return { qty, amount };
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!selectedCustomerId) {
      setCreateError('Please select a customer.');
      return;
    }

    const validItems = challanItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setCreateError('Please select at least one valid product item.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/challans', {
        customerId: selectedCustomerId,
        items: validItems,
        status: challanStatus,
      });

      setIsCreateModalOpen(false);
      fetchChallans();
      toast('Challan created successfully', 'success');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (challanId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change status of this challan to '${newStatus}'?`)) return;
    try {
      const res = await api.patch<{ message: string }>(`/challans/${challanId}/status`, { status: newStatus });
      toast(res.message, 'success');
      fetchChallans();
    } catch (err: any) {
      toast(err.message || 'Status update failed', 'error');
    }
  };

  const canCreate = ['ADMIN', 'SALES'].includes(user?.role || '');
  const totals = calculateTotal();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Sales Challan Module</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Generate sales challans, manage draft & confirmed states, and track inventory deductions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => {
              const data = challans.map(c => ({
                'Challan Number': c.challanNumber,
                Customer: c.customerSnap?.name || c.customer?.name,
                'Total Qty': c.totalQty,
                'Total Amount': c.totalAmount,
                Status: c.status,
                'Issued By': c.createdBy?.name || 'System',
                Date: new Date(c.createdAt).toLocaleDateString()
              }));
              exportToCsv('challans.csv', data);
              toast('Exported to CSV', 'info');
            }} 
            className="btn btn-secondary"
          >
            <Download size={18} />
            <span className="hidden-mobile">Export</span>
          </button>
          {canCreate && (
            <button onClick={openCreateChallanModal} className="btn btn-primary">
              <Plus size={18} />
              <span>Create Sales Challan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by challan # or customer name..."
              style={{ paddingLeft: '2.4rem' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challans List Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading sales challans...</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan Number</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Issued By</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No sales challans recorded.
                    </td>
                  </tr>
                ) : (
                  challans.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--accent-primary)' }}>{c.challanNumber}</strong>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{c.customerSnap?.name || c.customer?.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {c.customerSnap?.businessName || c.customer?.businessName}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.totalQty} items</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>₹{c.totalAmount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${
                          c.status === 'CONFIRMED' ? 'badge-success' : c.status === 'DRAFT' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {c.createdBy?.name || 'System'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => setPdfChallan(c)}
                            className="btn btn-secondary btn-sm"
                            title="View Printable PDF Invoice"
                          >
                            <Printer size={14} /> PDF
                          </button>

                          {c.status === 'DRAFT' && ['ADMIN', 'SALES', 'WAREHOUSE'].includes(user?.role || '') && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'CONFIRMED')}
                              className="btn btn-primary btn-sm"
                              title="Confirm Challan & Automatically Deduct Stock"
                              style={{ backgroundColor: '#10b981' }}
                            >
                              <CheckCircle size={14} /> Confirm
                            </button>
                          )}

                          {c.status === 'CONFIRMED' && ['ADMIN', 'SALES'].includes(user?.role || '') && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'CANCELLED')}
                              className="btn btn-danger btn-sm"
                              title="Cancel Challan & Revert Stock"
                            >
                              <XCircle size={14} /> Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} challans)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm">
              Previous
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Printable PDF Invoice Modal */}
      <ChallanPdfModal challan={pdfChallan} onClose={() => setPdfChallan(null)} />

      {/* Create Sales Challan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate New Sales Challan"
      >
        {createError && (
          <div style={{
            padding: '0.85rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            border: '1px solid var(--danger-border)'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertCircle size={16} /> Error Notice
            </div>
            {createError}
          </div>
        )}

        <form onSubmit={handleCreateChallan}>
          <div className="form-group">
            <label>Select Customer *</label>
            <select
              className="form-control"
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Choose Customer --</option>
              {customersList.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} ({cust.businessName}) - {cust.type}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                PRODUCT LINE ITEMS *
              </label>
              <button type="button" onClick={addItemRow} className="btn btn-secondary btn-sm">
                <Plus size={14} /> Add Product Line
              </button>
            </div>

            {challanItems.map((item, idx) => {
              const selectedProduct = productsList.find((p) => p.id === item.productId);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 1fr auto',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <select
                    className="form-control"
                    required
                    value={item.productId}
                    onChange={(e) => updateItemRow(idx, 'productId', e.target.value)}
                  >
                    <option value="">-- Select Product --</option>
                    {productsList.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (SKU: {prod.sku}) - ₹{prod.unitPrice} | Stock: {prod.currentStock}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="Qty"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                  />

                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                    ₹{selectedProduct ? (selectedProduct.unitPrice * item.quantity).toLocaleString('en-IN') : '0'}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger-text)', padding: '0.5rem' }}
                    disabled={challanItems.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#151d2a',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculated Total Quantity:</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>{totals.qty} items</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculated Total Amount:</span>
              <strong style={{ display: 'block', fontSize: '1.3rem', color: '#34d399' }}>
                ₹{totals.amount.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label>Challan Save Mode *</label>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cstatus"
                  value="DRAFT"
                  checked={challanStatus === 'DRAFT'}
                  onChange={() => setChallanStatus('DRAFT')}
                />
                <span style={{ color: 'var(--warning-text)', fontWeight: 600 }}>Save as Draft (No stock deduction yet)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cstatus"
                  value="CONFIRMED"
                  checked={challanStatus === 'CONFIRMED'}
                  onChange={() => setChallanStatus('CONFIRMED')}
                />
                <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>Confirm Immediately (Deducts Stock)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Generating...' : `Save Sales Challan (${challanStatus})`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
