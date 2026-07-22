import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<DashboardStats>('/dashboard/stats');
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 style={{ marginBottom: '1.5rem' }}>Operations Dashboard</h1>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height="120px" borderRadius="16px" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
          <Skeleton height="350px" borderRadius="16px" />
          <Skeleton height="350px" borderRadius="16px" />
        </div>
      </div>
    );
  }

  const { kpis, revenueData, lowStockProducts, recentActivity } = data || {
    kpis: { totalCustomers: 0, totalRevenue: 0, totalProducts: 0, lowStockCount: 0 },
    revenueData: [],
    lowStockProducts: [],
    recentActivity: []
  };

  const chartColor = theme === 'dark' ? '#6366f1' : '#4f46e5';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = theme === 'dark' ? '#9ca3af' : '#4b5563';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Operations Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Real-time business summary for wholesale operations & customer CRM
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['ADMIN', 'SALES'].includes(user?.role || '') && (
            <Link to="/challans" className="btn btn-primary btn-sm">
              + New Sales Challan
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Users />
          </div>
          <div>
            <div className="stat-val">{kpis.totalCustomers}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <Package />
          </div>
          <div>
            <div className="stat-val">{kpis.totalProducts}</div>
            <div className="stat-label">Catalog Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <AlertTriangle />
          </div>
          <div>
            <div className="stat-val" style={{ color: kpis.lowStockCount > 0 ? '#fbbf24' : 'inherit' }}>
              {kpis.lowStockCount}
            </div>
            <div className="stat-label">Low Stock Alerts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <TrendingUp />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#34d399' }}>
              ₹{kpis.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="stat-label">Confirmed Revenue</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Chart Section */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent-primary)" />
            Revenue Over Last 7 Days
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            {revenueData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }} 
                  />
                  <Bar dataKey="revenue" fill={chartColor} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No Sales Data" description="No confirmed challans in the last 7 days." />
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--accent-secondary)" />
            Recent Activity
          </h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {recentActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentActivity.map((act) => (
                  <div key={act.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-secondary)',
                      marginTop: '6px'
                    }} />
                    <div>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{act.description}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(act.date).toLocaleString()} by {act.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent activity.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {/* Low Stock Warning Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert color="var(--warning-text)" size={20} />
              <h3>Stock Replenishment Alerts</h3>
            </div>
            <Link to="/products" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              View Products &rarr;
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All inventory stock levels are healthy.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--warning-border)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      SKU: {p.sku} | Location: {p.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-warning">
                      {p.currentStock} / {p.minStockAlert}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
