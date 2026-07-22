import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, UserCheck, Package, DollarSign } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    { label: 'Admin', email: 'admin@company.com', pass: 'password123', icon: Shield, color: '#6366f1' },
    { label: 'Sales Exec', email: 'sales@company.com', pass: 'password123', icon: UserCheck, color: '#10b981' },
    { label: 'Warehouse Manager', email: 'warehouse@company.com', pass: 'password123', icon: Package, color: '#f59e0b' },
    { label: 'Accounts Manager', email: 'accounts@company.com', pass: 'password123', icon: DollarSign, color: '#06b6d4' },
  ];

  const handleQuickLogin = async (qEmail: string, qPass: string) => {
    setEmail(qEmail);
    setPassword(qPass);
    setError('');
    setLoading(true);
    try {
      await login(qEmail, qPass);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #172033 0%, #0b0f19 70%)',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 1rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.6rem',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}>
            E
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Mini ERP + CRM Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.3rem' }}>
            Operations & Distribution Management System
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ 1-Click Role Login Shortcuts
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {quickRoles.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => handleQuickLogin(r.email, r.pass)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    justifyContent: 'flex-start',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.6rem',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <Icon size={14} color={r.color} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
