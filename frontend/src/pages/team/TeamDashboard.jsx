/**
 * TEAM MEMBER DASHBOARD
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * EVENT CARD COVERS:
 *   backgroundImage: `url(${event.coverImageUrl || '/images/event-placeholder.jpg'})`
 *
 * RECENT UPLOAD THUMBNAILS:
 *   <img src={photo.thumbnailUrl} alt={photo.filename} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEvents } from '../../api/events';
import { toast } from '../../components/Toast';
import { TeamSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function TeamDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try { const r = await getEvents(); setEvents(r.data.events); }
    catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const topbarActions = (
    <button className="btn btn-gold btn-sm" onClick={() => navigate('/team/events')}>
      View All Events →
    </button>
  );

  return (
    <div className="app-shell">
      <TeamSidebar />
      <div className="main-content">
        <Topbar
          title={`${greet()}, ${user?.name?.split(' ')[0] || 'Team'} 👋`}
          subtitle="Here's what's assigned to you"
          actions={topbarActions}
        />
        <div className="page-body">

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:32 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'var(--navy-50)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div className="stat-value">{events.length}</div>
              <div className="stat-label">Assigned Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'var(--gold-pale)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="13" r="3"/></svg>
              </div>
              <div className="stat-value">—</div>
              <div className="stat-label">My Photos</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'var(--green-bg)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="stat-value">—</div>
              <div className="stat-label">Selected by Admin</div>
            </div>
          </div>

          {/* Assigned events */}
          <div className="section-header">
            <h2 className="section-title" style={{ margin: 0 }}>My Assigned Events</h2>
          </div>

          {loading ? <PageSpinner /> : events.length === 0 ? (
            <EmptyState icon="📋" title="No events assigned"
              description="Ask your Admin to assign you to an event." />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
              {events.map(ev => (
                <div key={ev._id} className="event-card" onClick={() => navigate(`/team/events/${ev._id}`)}>
                  {/* ── IMAGE SLOT: event cover ── */}
                  <div className="event-cover" style={{ backgroundImage: ev.coverImageUrl ? `url(${ev.coverImageUrl})` : undefined }}>
                    <div className="event-cover-overlay" />
                    <span className="badge badge-green" style={{ position:'absolute', top:12, right:12 }}>● Active</span>
                    <div className="event-cover-bottom">
                      <h3 style={{ color:'#fff', fontSize:15, fontWeight:700, marginBottom:2 }}>{ev.name}</h3>
                      {ev.date && <p style={{ color:'rgba(255,255,255,.65)', fontSize:12 }}>📅 {new Date(ev.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>}
                    </div>
                  </div>
                  <div className="event-body">
                    {ev.description && <p style={{ fontSize:13, color:'var(--text-mid)', marginBottom:12 }}>{ev.description.slice(0,80)}</p>}
                    <button className="btn btn-primary btn-sm w-full">View Event →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
