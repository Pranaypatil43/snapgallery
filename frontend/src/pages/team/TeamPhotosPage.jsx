/**
 * TEAM PHOTOS PAGE — all photos uploaded by this team member across all events
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * PHOTO THUMBNAILS:
 *   <img src={photo.thumbnailUrl} alt={photo.filename} />
 * FULL-RES LIGHTBOX:
 *   <img src={photo.storageUrl} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../../api/events';
import { getEventPhotos } from '../../api/photos';
import { toast } from '../../components/Toast';
import { TeamSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function TeamPhotosPage() {
  const navigate = useNavigate();
  const [photos,    setPhotos]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [lightbox,  setLightbox]  = useState(null);
  const [lbIdx,     setLbIdx]     = useState(0);

  /* Fetch all events → then all photos for each event (member only sees own) */
  const fetchAll = useCallback(async () => {
    try {
      const evRes = await getEvents();
      const events = evRes.data.events || [];
      const photoArrays = await Promise.all(
        events.map(ev => getEventPhotos(ev._id).then(r => r.data.photos.map(p => ({ ...p, eventName: ev.name, eventId: ev._id }))).catch(() => []))
      );
      setPhotos(photoArrays.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { toast.error('Failed to load photos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = photos.filter(p =>
    p.filename.toLowerCase().includes(search.toLowerCase()) ||
    p.eventName?.toLowerCase().includes(search.toLowerCase())
  );

  const openLightbox = (ph) => {
    setLightbox(ph);
    setLbIdx(filtered.findIndex(p => p._id === ph._id));
  };
  const prevPhoto = () => { const i = (lbIdx - 1 + filtered.length) % filtered.length; setLightbox(filtered[i]); setLbIdx(i); };
  const nextPhoto = () => { const i = (lbIdx + 1) % filtered.length; setLightbox(filtered[i]); setLbIdx(i); };

  const topbarActions = (
    <div className="search-wrap">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input className="search-input" placeholder="Search photos…" value={search} onChange={e => setSearch(e.target.value)} />
    </div>
  );

  return (
    <div className="app-shell">
      <TeamSidebar />
      <div className="main-content">
        <Topbar
          title="My Photos"
          subtitle={`${photos.length} photo${photos.length !== 1 ? 's' : ''} across all events`}
          actions={topbarActions}
        />
        <div className="page-body">

          {/* Stats strip */}
          {!loading && photos.length > 0 && (
            <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
              {[
                ['Total Photos',     photos.length,                                         '#0369a1'],
                ['Selected by Admin',photos.filter(p => p.isSelected).length,              '#16a34a'],
                ['Events Covered',   new Set(photos.map(p => p.eventId)).size,             '#92650a'],
              ].map(([l, v, col]) => (
                <div key={l} className="stat-card" style={{ flex:'1 1 160px' }}>
                  <div className="stat-value" style={{ color: col }}>{v}</div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>
          )}

          {loading ? <PageSpinner /> : filtered.length === 0 ? (
            <EmptyState
              icon="📷"
              title={search ? 'No photos found' : 'No photos yet'}
              description={search ? 'Try a different search.' : 'Upload photos from an event page.'}
              action={!search && (
                <button className="btn btn-primary" onClick={() => navigate('/team/upload')}>Upload Photos</button>
              )}
            />
          ) : (
            <>
              <div className="photo-grid-lg">
                {filtered.map(ph => (
                  <div key={ph._id} className="photo-card" onClick={() => openLightbox(ph)}>
                    {/* ── IMAGE SLOT: thumbnail ── */}
                    {ph.thumbnailUrl
                      ? <img src={ph.thumbnailUrl} alt={ph.filename} />
                      : <div style={{ width:'100%', height:'100%', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🖼</div>
                    }
                    <div className="photo-overlay" />
                    {ph.isSelected && (
                      <div style={{ position:'absolute', top:8, left:8, background:'var(--gold)', borderRadius:5, padding:'2px 6px', fontSize:9, fontWeight:800, color:'var(--navy)', zIndex:2 }}>
                        ✓ SELECTED
                      </div>
                    )}
                    <div className="photo-info">
                      <div className="photo-info-name">{ph.filename}</div>
                      <div className="photo-info-sub">{ph.eventName}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table view */}
              <div style={{ marginTop:32 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>All Uploads</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Filename</th><th>Event</th><th>Size</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {filtered.map(ph => (
                        <tr key={ph._id} style={{ cursor:'pointer' }} onClick={() => openLightbox(ph)}>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:36, height:36, borderRadius:6, overflow:'hidden', flexShrink:0, background:'var(--surface)' }}>
                                {/* ── IMAGE SLOT: table row thumbnail ── */}
                                {ph.thumbnailUrl && <img src={ph.thumbnailUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                              </div>
                              <span style={{ fontSize:13, fontWeight:500 }}>{ph.filename}</span>
                            </div>
                          </td>
                          <td style={{ fontSize:13, color:'var(--text-mid)' }}>{ph.eventName}</td>
                          <td style={{ fontSize:13, color:'var(--text-soft)' }}>{ph.fileSize ? `${(ph.fileSize/1024/1024).toFixed(1)} MB` : '—'}</td>
                          <td style={{ fontSize:13, color:'var(--text-soft)' }}>{new Date(ph.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</td>
                          <td>
                            {ph.isSelected
                              ? <span className="badge badge-gold">✓ Selected</span>
                              : <span className="badge badge-navy">Uploaded</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-counter">{lbIdx + 1} / {filtered.length}</div>
          <button className="lightbox-close btn btn-ghost btn-icon" style={{ color:'#fff' }} onClick={() => setLightbox(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {/* ── IMAGE SLOT: full-res lightbox image ── */}
          <img className="lightbox-img" src={lightbox.storageUrl} alt={lightbox.filename} onClick={e => e.stopPropagation()} />
          <button className="lightbox-nav lightbox-nav-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}>‹</button>
          <button className="lightbox-nav lightbox-nav-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}>›</button>
          <div className="lightbox-actions">
            <a href={lightbox.storageUrl} download={lightbox.filename} className="btn btn-outline btn-sm"
              style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)' }} onClick={e => e.stopPropagation()}>
              ↓ Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
