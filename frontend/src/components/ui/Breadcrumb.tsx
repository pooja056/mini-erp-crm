import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <nav aria-label="breadcrumb" style={{ marginBottom: '1.5rem' }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontSize: '0.85rem'
      }}>
        <li style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Home size={14} />
          </Link>
        </li>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const formattedName = name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');

          return (
            <li key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChevronRight size={14} color="var(--text-muted)" />
              {isLast ? (
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }} aria-current="page">
                  {formattedName}
                </span>
              ) : (
                <Link to={routeTo} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {formattedName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
