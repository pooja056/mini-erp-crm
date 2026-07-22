import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { StockLog, Pagination } from '../types';
import { History, ArrowUpRight, ArrowDownLeft, Clock, User, Package, Download } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { exportToCsv } from '../utils/exportCsv';

export const StockLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [movementFilter, setMovementFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        movementType: movementFilter,
      }).toString();

      const res = await api.get<{ logs: StockLog[]; pagination: Pagination }>(`/stock-logs?${query}`);
      setLogs(res.logs || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch stock logs:', err);
      toast('Failed to load stock logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, movementFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Stock Movement Audit Trail</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Complete historical audit log of all inventory additions (IN) and sales/damage subtractions (OUT)
          </p>
        </div>
        <select
          className="form-control"
          style={{ width: '200px' }}
          value={movementFilter}
          onChange={(e) => {
            setMovementFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Movement Types</option>
          <option value="IN">Stock IN (Addition)</option>
          <option value="OUT">Stock OUT (Reduction)</option>
        </select>
        <button 
          onClick={() => {
            const data = logs.map(l => ({
              Timestamp: new Date(l.createdAt).toLocaleString(),
              Product: l.product?.name || 'Unknown',
              SKU: l.product?.sku || '',
              'Movement Type': l.movementType,
              'Qty Changed': l.qtyChanged,
              Reason: l.reason,
              'Created By': l.createdBy?.name || 'System'
            }));
            exportToCsv('stock-logs.csv', data);
            toast('Exported to CSV', 'info');
          }} 
          className="btn btn-secondary"
          style={{ marginLeft: '0.75rem' }}
        >
          <Download size={18} />
          <span className="hidden-mobile">Export</span>
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading stock movement logs...</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product & SKU</th>
                  <th>Movement Type</th>
                  <th>Quantity Changed</th>
                  <th>Reason / Context</th>
                  <th>Created By User</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No stock movement records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} /> {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.product?.name || 'Unknown Product'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          SKU: {log.product?.sku}
                        </div>
                      </td>
                      <td>
                        {log.movementType === 'IN' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ArrowDownLeft size={12} /> Stock IN
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ArrowUpRight size={12} /> Stock OUT
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '1rem', color: log.movementType === 'IN' ? '#34d399' : '#f87171' }}>
                        {log.movementType === 'IN' ? `+${log.qtyChanged}` : `-${log.qtyChanged}`} units
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{log.reason}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={14} /> {log.createdBy?.name || 'System User'} ({log.createdBy?.role})
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

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} movement logs)
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
    </div>
  );
};
