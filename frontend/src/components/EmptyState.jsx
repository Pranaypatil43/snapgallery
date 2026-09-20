export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <p className="empty-desc">{description}</p>}
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" style={{ background: 'var(--red-bg)' }}>⚠️</div>
      <div className="empty-title">An error occurred</div>
      <p className="empty-desc">{message}</p>
      {onRetry && (
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function UnauthorizedState() {
  return (
    <div className="empty-state">
      <div className="empty-icon" style={{ background: 'var(--red-bg)' }}>🔒</div>
      <div className="empty-title">Access Denied</div>
      <p className="empty-desc">You don't have permission to view this page.</p>
    </div>
  );
}
