import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Customer, FollowUpNote, Challan } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Plus,
  FileText,
  Clock,
  UserCheck,
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomerDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<{ customer: Customer }>(`/customers/${id}`);
      setCustomer(res.customer);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !id) return;
    setSubmittingNote(true);
    try {
      await api.post(`/customers/${id}/notes`, { note: noteText });
      setNoteText('');
      fetchCustomerDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading customer profile...</div>;
  }

  if (error || !customer) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--danger-text)' }}>{error || 'Customer not found'}</p>
        <button onClick={() => navigate('/customers')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          &larr; Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/customers')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Customer List
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>{customer.name}</h1>
              <span className={`badge ${
                customer.status === 'ACTIVE' ? 'badge-success' : customer.status === 'LEAD' ? 'badge-warning' : 'badge-danger'
              }`}>
                {customer.status}
              </span>
              <span className="badge badge-info">{customer.type}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              <Building size={14} style={{ verticalAlign: 'middle' }} /> {customer.businessName}
              {customer.gstNumber && ` | GST: ${customer.gstNumber}`}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Customer Profile Meta */}
        <div className="card">
          <h3>Customer Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Contact</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: '#fff', fontWeight: 600 }}>
                <Phone size={16} color="var(--accent-secondary)" /> {customer.mobile}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: '#fff', fontWeight: 600 }}>
                <Mail size={16} color="var(--accent-secondary)" /> {customer.email}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Address</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.2rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <MapPin size={16} color="var(--accent-secondary)" style={{ marginTop: '2px' }} /> {customer.address}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next Follow-up Date</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: 'var(--warning-text)', fontWeight: 600 }}>
                <Calendar size={16} /> {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'Not Scheduled'}
              </div>
            </div>

            {customer.notes && (
              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Notes</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-up Timeline & Notes Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <MessageSquare color="var(--accent-primary)" size={20} />
              <h3>CRM Follow-Up Notes & Activity Log</h3>
            </div>

            {/* Form to Add Follow-up Note */}
            <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Record call discussion, price negotiation, or follow-up note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={submittingNote} className="btn btn-primary btn-sm">
                <Plus size={16} /> {submittingNote ? 'Saving...' : 'Add Follow-up Note'}
              </button>
            </form>

            {/* Notes Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {!customer.followUps || customer.followUps.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No follow-up notes logged yet.</p>
              ) : (
                customer.followUps.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#151d2a',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                        <UserCheck size={14} /> <strong>{n.createdBy?.name || 'System User'}</strong> ({n.createdBy?.role})
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} /> {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'pre-wrap' }}>{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
