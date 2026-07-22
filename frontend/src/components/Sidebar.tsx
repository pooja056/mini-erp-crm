import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  History,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { label: 'Customer CRM', path: '/customers', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'] },
    { label: 'Products & Stock', path: '/products', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { label: 'Sales Challans', path: '/challans', icon: FileText, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { label: 'Stock Movement Log', path: '/stock-logs', icon: History, roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.2rem'
        }}>
          E
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f9fafb', lineHeight: 1.1 }}>Mini ERP Portal</h2>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operations CRM</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {navItems
          .filter((item) => user && item.roles.includes(user.role))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  justifyContent: 'flex-start',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  borderRadius: '10px'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {user && (
        <div style={{
          marginTop: 'auto',
          padding: '1rem',
          backgroundColor: '#151d2a',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
              <ShieldCheck size={12} color="var(--success-text)" />
              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>{user.role}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
