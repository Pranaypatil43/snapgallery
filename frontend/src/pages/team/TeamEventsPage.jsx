/**
 * TEAM EVENTS PAGE — list of all events assigned to this team member
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * EVENT CARD COVERS:
 *   backgroundImage: `url(${event.coverImageUrl})`  on .event-cover
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../../api/events';
import { toast } from '../../components/Toast';
import { TeamSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function TeamEventsPage() {
  const navigate = useNavigate();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const fetchEvents = useCallback(async () => {
    try { const r = await getEvents(); setEvents(r.data.events); }
    catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filtered = events.filter(ev =>
    ev.name.toLowerCase().includes(search.toLowerCase()) ||
    (ev.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const topbarActions = (
    <div className="search-wrap">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        className="search-input"
        placeholder="Search events…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  );

  return (
    <div className="app-shell">
      <TeamSidebar />
      <div className="main-content">
        <Topbar
          title="My Events"
          subtitle={`${events.length} event${events.length !== 1 ? 's' : ''} assigned to you`}
          actions={topbarActions}
        />
        <div className="page-body">
          {loading ? <PageSpinner /> : filtered.length === 0 ? (
            <EmptyState
              icon="📋"
              title={search ? 'No events found' : 'No events assigned'}
              description={search ? 'Try a different search term.' : 'Ask your Admin to assign you to an event.'}
            />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
              {filtered.map(ev => (
                <div key={ev._id} className="event-card" onClick={() => navigate(`/team/events/${ev._id}`)}>
                  {/* ── IMAGE SLOT: event cover ── */}
                  <div className="event-cover" style={{ backgroundImage: ev.coverImageUrl ? `url(${ev.coverImageUrl})` : undefined }}>
                    <div className="event-cover-overlay" />
                    <span className="badge badge-green" style={{ position:'absolute', top:12, right:12 }}>● Active</span>
                    <div className="event-cover-bottom">
                      <h3 style={{ color:'#fff', fontSize:15, fontWeight:700, marginBottom:2 }}>{ev.name}</h3>
                      {ev.date && (
                        <p style={{ color:'rgba(255,255,255,.65)', fontSize:12 }}>
                          📅 {new Date(ev.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="event-body">
                    {ev.description && (
                      <p style={{ fontSize:13, color:'var(--text-mid)', marginBottom:12 }}>{ev.description.slice(0, 80)}</p>
                    )}
                    <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, color:'var(--text-soft)' }}>
                        {ev.teamMembers?.length || 0} photographer{(ev.teamMembers?.length || 0) !== 1 ? 's' : ''}
                      </span>
                      <button className="btn btn-primary btn-sm">Open →</button>
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
