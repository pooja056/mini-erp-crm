import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, UserCheck, Package, DollarSign, ArrowRight } from 'lucide-react';

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
    { label: 'Admin', email: 'admin@company.com', pass: 'password123', icon: Shield, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Sales Exec', email: 'sales@company.com', pass: 'password123', icon: UserCheck, color: '#059669', bg: '#ecfdf5' },
    { label: 'Warehouse', email: 'warehouse@company.com', pass: 'password123', icon: Package, color: '#d97706', bg: '#fffbeb' },
    { label: 'Accounts', email: 'accounts@company.com', pass: 'password123', icon: DollarSign, color: '#0284c7', bg: '#f0f9ff' },
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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-main)' }}>
      {/* Left Panel: Artistic / Brand Area */}
      <div style={{
        flex: 1,
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        position: 'relative',
        overflow: 'hidden'
      }} className="auth-left-panel">
        
        {/* Decorative background circles */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0) 70%)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '800px', height: '800px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0) 70%)',
          borderRadius: '50%'
        }}></div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            marginBottom: '2rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '2rem',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)'
          }}>
            E
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Transforming <span style={{ color: '#4f46e5' }}>Operations</span> & Management.
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#475569', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Experience the next generation Mini ERP + CRM. Seamlessly integrate your sales, inventory, and customer relationships into one powerful platform.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#eef2ff', padding: '0.75rem', borderRadius: '12px' }}><Shield size={20} color="#4f46e5" /></div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Enterprise Grade</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Role-based access</p>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '12px' }}><Package size={20} color="#059669" /></div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Atomic Inventory</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Real-time sync</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'var(--bg-main)'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue to your dashboard.</p>
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              border: '1px solid var(--danger-border)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Shield size={18} />
              {error}
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {quickRoles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => handleQuickLogin(r.email, r.pass)}
                    className="quick-role-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ 
                      backgroundColor: r.bg, 
                      padding: '0.5rem', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={16} color={r.color} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Or use email
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  padding: '0.85rem 1rem', 
                  fontSize: '0.95rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
                <a href="#" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Forgot?</a>
              </div>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  padding: '0.85rem 1rem', 
                  fontSize: '0.95rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                marginTop: '0.5rem', 
                padding: '0.9rem',
                borderRadius: '12px',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              disabled={loading}
            >
              <span style={{ flex: 1, textAlign: 'center' }}>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

        </div>
      </div>
      
      {/* Add this bit of CSS directly in the component for the panel visibility and hover effects */}
      <style>{`
        @media (min-width: 900px) {
          .auth-left-panel { display: flex !important; }
        }
        .quick-role-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md) !important;
          border-color: var(--accent-primary) !important;
        }
      `}</style>
    </div>
  );
};
