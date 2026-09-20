/**
 * EVENTS PAGE (Admin)
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * EVENT CARD COVERS: same as AdminDashboard — use event.coverImageUrl
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../../api/events';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function EventsPage() {
  const navigate = useNavigate();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const fetch = useCallback(async () => {
    try {
      const res = await getEvents();
      setEvents(res.data.events);
    } catch { toast.error('Failed to load events'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = events.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'published' ? e.isPublished : !e.isPublished);
    return matchSearch && matchFilter;
  });

  const topbarActions = (
    <button className="btn btn-gold" onClick={() => navigate('/admin/events/new')}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Create Event
    </button>
  );

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Topbar title="Events" subtitle={`${events.length} total events`} actions={topbarActions} />
        <div className="page-body">
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="search-input" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="tabs">
              {['all','active','published'].map(f => (
                <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-soft)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading ? <PageSpinner /> : filtered.length === 0 ? (
            <EmptyState icon="📋" title="No events found"
              description={search ? 'Try a different search term.' : 'Create your first event to get started.'}
              action={!search && <button className="btn btn-primary" onClick={() => navigate('/admin/events/new')}>+ Create Event</button>} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
              {filtered.map(ev => (
                <div key={ev._id} className="event-card" onClick={() => navigate(`/admin/events/${ev._id}`)}>
                  {/* ── IMAGE SLOT: backgroundImage for cover ── */}
                  <div className="event-cover" style={{ backgroundImage: ev.coverImageUrl ? `url(${ev.coverImageUrl})` : undefined }}>
                    <div className="event-cover-overlay" />
                    <div className="event-cover-status">
                      <span className={`badge ${ev.isPublished ? 'badge-green' : 'badge-amber'}`}>
                        ● {ev.isPublished ? 'Published' : 'Active'}
                      </span>
                    </div>
                    <div className="event-cover-bottom">
                      <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{ev.name}</h3>
                      <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, display: 'flex', gap: 8 }}>
                        {ev.date && <span>📅 {new Date(ev.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>}
                        {ev.teamMembers?.length > 0 && <span>👥 {ev.teamMembers.length}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="event-body">
                    <div className="event-stats">
                      <div><div className="event-stat-num">{ev.photoCount || 0}</div><div className="event-stat-lbl">Photos</div></div>
                      <div><div className="event-stat-num">{ev.selectedCount || 0}</div><div className="event-stat-lbl">Selected</div></div>
                      <div><div className="event-stat-num">{ev.teamMembers?.length || 0}</div><div className="event-stat-lbl">Team</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); navigate(`/admin/events/${ev._id}`); }}>
                        View Event
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); navigate(`/admin/events/${ev._id}/select`); }}>
                        Gallery
                      </button>
                    </div>
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
