import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <FolderOpen size={48} />,
  action
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border-color)',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        {icon}
      </div>
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>
        {title}
      </h3>
      <p style={{ marginBottom: '1.5rem', maxWidth: '400px', lineHeight: 1.5 }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
