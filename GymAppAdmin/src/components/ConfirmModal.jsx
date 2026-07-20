import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirmar Acción',
  message = '¿Estás seguro de realizar esta acción?',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal" 
        style={{ 
          maxWidth: 420, 
          padding: 24, 
          borderRadius: 16, 
          backgroundColor: '#1E293B', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDanger ? '#EF4444' : '#F97316'
            }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
              {title}
            </h3>
          </div>
          <button className="btn btn--ghost" style={{ padding: 4, borderRadius: '50%', color: '#94A3B8' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 24px 0', fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" style={{ padding: '8px 16px', borderRadius: 8, color: '#CBD5E1' }} onClick={onClose}>
            {cancelText}
          </button>
          <button 
            type="button" 
            className={isDanger ? "btn btn--danger" : "btn btn--primary"}
            style={{ padding: '8px 18px', borderRadius: 8, fontWeight: 600 }}
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
