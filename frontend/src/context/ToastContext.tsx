import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: '300px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: `var(--${t.type}-bg)`,
            color: `var(--${t.type}-text)`,
            border: `1px solid var(--${t.type}-border)`,
            boxShadow: 'var(--shadow-md)',
            animation: 'modalFadeIn 0.3s ease-out'
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.message}</span>
            <button 
              onClick={() => removeToast(t.id)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
