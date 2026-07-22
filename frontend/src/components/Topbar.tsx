import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User as UserIcon, Moon, Sun, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Welcome back,</span>
        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user?.name}</strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={toggleTheme} 
          className="btn btn-secondary btn-sm" 
          title="Toggle Theme"
          style={{ padding: '0.35rem 0.5rem', border: 'none', background: 'transparent' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-input)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer'
          }}>
            <UserIcon size={14} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profile:</span>
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>{user?.role}</span>
          </div>
        </Link>

        <button onClick={logout} className="btn btn-secondary btn-sm" title="Logout">
          <LogOut size={16} />
          <span className="hidden-mobile">Logout</span>
        </button>
      </div>
    </header>
  );
};
