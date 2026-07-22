import React from 'react';
import { Modal } from '../Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {isDanger && (
          <div style={{ color: 'var(--danger-text)', background: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '50%' }}>
            <AlertTriangle size={24} />
          </div>
        )}
        <div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
