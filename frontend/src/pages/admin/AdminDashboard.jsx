import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEvents } from '../../api/events';
import { getAdminGalleries } from '../../api/galleries';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

/* ── Animated stat card ── */
function StatCard({ icon, label, value, change, gradient, delay = 0 }) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      {/* Icon with gradient pill */}
      <div style={{
        width:46, height:46, borderRadius:13,
        background: gradient,
        display:'flex', alignItems:'center', justifyContent:'center',
        marginBottom:16, boxShadow:`0 4px 16px ${gradient.includes('ff4d') ? 'rgba(255,77,109,.3)' : gradient.includes('8b5c') ? 'rgba(139,92,246,.3)' : gradient.includes('00d4') ? 'rgba(0,212,161,.3)' : 'rgba(245,158,11,.3)'}`,
      }}>
        {icon}
      </div>
      <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:36, fontWeight:800, color:'#111827', lineHeight:1, letterSpacing:'-.03em' }}>{value}</div>
      <div style={{ fontSize:13, color:'#6b7280', marginTop:4, fontWeight:500 }}>{label}</div>
      {change && <div style={{ fontSize:12, fontWeight:600, color:'#10b981', marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        {change}
      </div>}
    </div>
  );
}

/* ── Event card ── */
function EventCard({ event, onView, delay = 0 }) {
  const statusColor = event.status === 'published' ? '#10b981' : '#ff4d6d';
  const statusLabel = event.status === 'published' ? 'Published' : 'Active';

  return (
    <div className="event-card" onClick={onView} style={{ animationDelay:`${delay}ms` }}>
      {/* Cover */}
      <div className="event-cover" style={{ backgroundImage: event.coverImageUrl ? `url(${event.coverImageUrl})` : undefined }}>
        {!event.coverImageUrl && (
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#0e1220,#242d42)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.2">
              <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
        )}
        <div className="event-cover-overlay"/>
        <div style={{ position:'absolute', top:12, right:12 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:`${statusColor}22`, color:statusColor, border:`1px solid ${statusColor}44` }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:statusColor, display:'inline-block' }}/>
            {statusLabel}
          </span>
        </div>
        <div className="event-cover-bottom">
          <h3 style={{ color:'#fff', fontFamily:"'DM Serif Display',Georgia,serif", fontSize:15, fontWeight:700, marginBottom:3 }}>{event.name}</h3>
          {event.date && <p style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>
            {new Date(event.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
          </p>}
        </div>
      </div>

      {/* Body */}
      <div className="event-body">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14, padding:'12px', background:'#f7f8fc', borderRadius:10 }}>
          {[['Photos', event.photoCount||0],['Selected',event.selectedCount||0],['Team',event.teamMembers?.length||0]].map(([l,v]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:18, fontWeight:800, color:'#111827' }}>{v}</div>
              <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.06em', marginTop:1 }}>{l}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-sm w-full" onClick={e=>{e.stopPropagation();onView();}} style={{ borderRadius:10 }}>
          Open Event →
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [events,    setEvents]    = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchData = useCallback(async () => {
    try {
      const [evRes, galRes] = await Promise.all([getEvents(), getAdminGalleries()]);
      setEvents(evRes.data.events);
      setGalleries(galRes.data.galleries);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPhotos    = events.reduce((s,e) => s+(e.photoCount||0), 0);
  const selectedPhotos = galleries.reduce((s,g) => s+(g.selectedPhotos?.length||0), 0);
  const published      = galleries.filter(g=>g.isPublished).length;

  const topbarActions = (
    <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/events/new')} style={{ borderRadius:10 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      New Event
    </button>
  );

  if (loading) return <div className="app-shell"><AdminSidebar/><div className="main-content"><PageSpinner/></div></div>;

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Topbar
          title={`${greet()}, ${user?.name?.split(' ')[0]||'Admin'} 👋`}
          subtitle={new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          actions={topbarActions}
        />
        <div className="page-body">

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:36 }}>
            <StatCard label="Total Events" value={events.length} change="2 this month" delay={0}
              gradient="linear-gradient(135deg,#ff4d6d,#e8365a)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />
            <StatCard label="Total Photos" value={totalPhotos.toLocaleString()} change="1,250 this week" delay={80}
              gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="13" r="3"/></svg>}
            />
            <StatCard label="Selected Photos" value={selectedPhotos.toLocaleString()} change="600 this week" delay={160}
              gradient="linear-gradient(135deg,#00d4a1,#00b389)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            />
            <StatCard label="Published Galleries" value={published} change="1 this week" delay={240}
              gradient="linear-gradient(135deg,#f59e0b,#d97706)"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>}
            />
          </div>

          {/* Recent events */}
          <div className="section-header">
            <h2 className="section-title" style={{ margin:0 }}>Recent Events</h2>
            <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/admin/events')}>View all →</button>
          </div>

          {events.length === 0 ? (
            <EmptyState icon="🎉" title="No events yet" description="Create your first event to get started."
              action={<button className="btn btn-primary" onClick={()=>navigate('/admin/events/new')}>+ Create Event</button>}/>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:36 }}>
              {events.slice(0,6).map((ev,i) => (
                <EventCard key={ev._id} event={ev} delay={i*60} onView={()=>navigate(`/admin/events/${ev._id}`)}/>
              ))}
            </div>
          )}

          {/* Published galleries */}
          {published > 0 && (
            <>
              <div className="section-header">
                <h2 className="section-title" style={{ margin:0 }}>Live Galleries</h2>
                <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/admin/galleries')}>Manage →</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {galleries.filter(g=>g.isPublished).slice(0,3).map((g,i) => (
                  <div key={g._id} className="card" style={{ padding:'18px 20px', animation:`cardSlide .4s ease ${i*80}ms both` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:14, fontWeight:700, color:'#111827' }}>{g.title}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:'rgba(16,185,129,.1)', color:'#059669', border:'1px solid rgba(16,185,129,.2)' }}>
                        ● Live
                      </span>
                    </div>
                    <p style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>{g.eventId?.name}</p>
                    <div style={{ fontSize:11.5, color:'#8b5cf6', wordBreak:'break-all', marginBottom:10, fontFamily:'monospace' }}>
                      {`${window.location.origin}/gallery/${g.slug}`}
                    </div>
                    <button className="btn btn-outline btn-sm w-full" style={{ borderRadius:8 }}
                      onClick={()=>{ navigator.clipboard?.writeText(`${window.location.origin}/gallery/${g.slug}`); toast.success('Link copied!'); }}>
                      Copy Link
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
