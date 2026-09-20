import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Minimal icon set ── */
const icons = {
  dashboard: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  events: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  photos: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  galleries: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  team: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  settings: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  logout: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  upload: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  profile: () => (
    <svg className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

/* ── Camera logo mark ── */
function LogoMark() {
  return (
    <div style={{
      width:38, height:38, borderRadius:11,
      background:'linear-gradient(135deg,#ff4d6d 0%,#8b5cf6 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink:0,
      boxShadow:'0 4px 18px rgba(255,77,109,.4)',
      animation:'glowPulse 3s ease-in-out infinite',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
        <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
    </div>
  );
}

function NavItem({ icon: IconComp, label, path, badge, onClick }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const active = path
    ? location.pathname === path || (path !== '/admin' && path !== '/team' && location.pathname.startsWith(path))
    : false;

  const handleClick = () => { if (onClick) { onClick(); return; } if (path) navigate(path); };

  return (
    <div
      className={`sidebar-item${active ? ' active' : ''}`}
      onClick={handleClick}
      style={{ position:'relative' }}
    >
      {/* Active glow spot */}
      {active && (
        <div style={{
          position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
          width:3, height:'60%', borderRadius:'0 3px 3px 0',
          background:'linear-gradient(180deg,#ff4d6d,#8b5cf6)',
          boxShadow:'0 0 8px rgba(255,77,109,.6)',
        }}/>
      )}
      <IconComp />
      <span style={{ flex:1 }}>{label}</span>
      {badge && <span className="sidebar-badge">{badge}</span>}
    </div>
  );
}

/* ── Shared sidebar shell ── */
function SidebarShell({ subtitle, navItems, user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = () => { logout(); navigate('/login'); };

  // avatar initials
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <LogoMark />
        <div>
          <div className="sidebar-logo-text">SnapGallery</div>
          <div className="sidebar-logo-sub">{subtitle}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(item =>
          item.section
            ? <div key={item.section} className="sidebar-section">{item.section}</div>
            : <NavItem key={item.label} {...item} />
        )}
        <NavItem icon={icons.logout} label="Logout" onClick={handleLogout} />
      </nav>

      {/* Footer user */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div style={{
            width:32, height:32, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,#ff4d6d,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:700, color:'#fff',
          }}>
            {initials}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sidebar-user-name truncate">{user?.name || '—'}</div>
            <div className="sidebar-user-role">{subtitle}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AdminSidebar() {
  const { user } = useAuth();
  return (
    <SidebarShell
      subtitle="Admin Panel"
      user={user}
      navItems={[
        { section: 'Main' },
        { icon: icons.dashboard, label: 'Dashboard',    path: '/admin' },
        { icon: icons.events,    label: 'Events',       path: '/admin/events' },
        { icon: icons.galleries, label: 'Galleries',    path: '/admin/galleries' },
        { icon: icons.team,      label: 'Team Members', path: '/admin/team' },
        { section: 'Account' },
        { icon: icons.settings,  label: 'Settings',     path: '/admin/settings' },
      ]}
    />
  );
}

export function TeamSidebar() {
  const { user } = useAuth();
  return (
    <SidebarShell
      subtitle="Team Portal"
      user={user}
      navItems={[
        { section: 'Menu' },
        { icon: icons.dashboard, label: 'Dashboard',    path: '/team' },
        { icon: icons.events,    label: 'My Events',    path: '/team/events' },
        { icon: icons.photos,    label: 'My Photos',    path: '/team/photos' },
        { icon: icons.upload,    label: 'Upload Photos', path: '/team/upload' },
        { section: 'Account' },
        { icon: icons.profile,   label: 'Profile',      path: '/team/profile' },
      ]}
    />
  );
}
