import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, subtitle, actions }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div className="topbar-actions">
        {actions}
        {/* Notification bell */}
        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }} aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span style={{ position:'absolute',top:6,right:6,width:8,height:8,background:'var(--red)',borderRadius:'50%',border:'2px solid #fff' }} />
        </button>
        {/* Avatar */}
        {/* ── IMAGE SLOT: set backgroundImage on avatar div for user profile photo ── */}
        <div className="avatar avatar-md" style={{ background: user?.role === 'admin' ? 'linear-gradient(135deg,var(--gold),var(--gold-light))' : '#7c3aed', color: user?.role === 'admin' ? 'var(--navy)' : '#fff', cursor: 'pointer' }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
