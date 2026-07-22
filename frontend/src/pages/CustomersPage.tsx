import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Customer, Pagination } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, Plus, Edit, Eye, UserPlus, Phone, Mail, Building, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToCsv } from '../utils/exportCsv';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    type: 'RETAIL',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search: debouncedSearch,
        type: typeFilter,
        status: statusFilter,
      }).toString();

      const res = await api.get<{ customers: Customer[]; pagination: Pagination }>(`/customers?${query}`);
      setCustomers(res.customers || []);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      toast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      type: 'RETAIL',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      type: c.type,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? new Date(c.followUpDate).toISOString().slice(0, 10) : '',
      notes: c.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast('Customer updated successfully', 'success');
      } else {
        await api.post('/customers', formData);
        toast('Customer created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = ['ADMIN', 'SALES'].includes(user?.role || '');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Customer CRM Module</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage leads, wholesale clients, distributors, and sales follow-ups
          </p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => {
                const data = customers.map(c => ({
                  Name: c.name,
                  Business: c.businessName,
                  Mobile: c.mobile,
                  Email: c.email,
                  Type: c.type,
                  Status: c.status
                }));
                exportToCsv('customers.csv', data);
                toast('Exported to CSV', 'info');
              }} 
              className="btn btn-secondary"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={18} />
              <span>Add New Customer</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by customer name, business, mobile, email..."
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
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Customer Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading customer directory...</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer / Business</th>
                  <th>Contact Information</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No customers found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{c.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                          <Building size={12} /> {c.businessName}
                          {c.gstNumber && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.gstNumber})</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Phone size={12} color="var(--accent-secondary)" /> {c.mobile}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mail size={12} /> {c.email}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{c.type}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          c.status === 'ACTIVE' ? 'badge-success' : c.status === 'LEAD' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.followUpDate ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {new Date(c.followUpDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None set</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(`/customers/${c.id}`)}
                            className="btn btn-secondary btn-sm"
                            title="View Customer Detail Page & Follow-up Notes"
                          >
                            <Eye size={14} /> Detail
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(c)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Customer"
                            >
                              <Edit size={14} /> Edit
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

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total customers)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        {formError && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Business Name *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                className="form-control"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>GST Number (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="27AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Customer Type *</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              className="form-control"
              rows={2}
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Initial Notes / Follow-up Details</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Add key observations or sales notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
