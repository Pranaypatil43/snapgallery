import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const mouseDownTarget = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => { mouseDownTarget.current = e.target; }}
      onMouseUp={(e) => {
        if (mouseDownTarget.current === e.currentTarget && e.target === e.currentTarget) {
          onClose?.();
        }
        mouseDownTarget.current = null;
      }}
    >
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true">
        {title && (
          <div className="modal-header">
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
            {onClose && (
              <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: 'var(--text-mid)' }}>{message}</p>
    </Modal>
  );
}
