/**
 * TEAM EVENT PAGE
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * 1. EVENT HERO COVER:
 *    On .event-hero div add:
 *      style={{ backgroundImage: `url(${event.coverImageUrl || '/images/event-placeholder.jpg'})` }}
 *
 * 2. PHOTO THUMBNAILS (My Uploaded Photos):
 *    <img src={photo.thumbnailUrl} alt={photo.filename} />
 *    Gold ring around photos selected by admin (photo.isSelected).
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../../api/events';
import { getEventPhotos } from '../../api/photos';
import { toast } from '../../components/Toast';
import { TeamSidebar } from '../../components/Sidebar';
import UploadModal from '../../components/UploadModal';
import { PageSpinner } from '../../components/Spinner';

export default function TeamEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event,      setEvent]      = useState(null);
  const [photos,     setPhotos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox,   setLightbox]   = useState(null);
  const [lightboxIdx,setLightboxIdx]= useState(0);

  const fetch = useCallback(async () => {
    try {
      const [evRes, phRes] = await Promise.all([getEvent(id), getEventPhotos(id)]);
      setEvent(evRes.data.event);
      setPhotos(phRes.data.photos);
    } catch (err) {
      toast.error('Failed to load event');
      if (err.response?.status === 403) navigate('/team');
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetch(); }, [fetch]);

  const openLightbox = (ph) => {
    setLightbox(ph);
    setLightboxIdx(photos.findIndex(p => p._id === ph._id));
  };
  const prev = () => { const i = (lightboxIdx - 1 + photos.length) % photos.length; setLightbox(photos[i]); setLightboxIdx(i); };
  const next = () => { const i = (lightboxIdx + 1) % photos.length; setLightbox(photos[i]); setLightboxIdx(i); };

  if (loading) return (
    <div className="app-shell"><TeamSidebar />
      <div className="main-content"><PageSpinner /></div>
    </div>
  );

  const selectedCount = photos.filter(p => p.isSelected).length;

  return (
    <div className="app-shell">
      <TeamSidebar />
      <div className="main-content" style={{ overflowY: 'auto' }}>

        {/* ── HERO ── */}
        {/* ── IMAGE SLOT 1: backgroundImage on event-hero ── */}
        <div className="event-hero" style={{
          backgroundImage: event?.coverImageUrl ? `url(${event.coverImageUrl})` : undefined,
        }}>
          <div className="event-hero-overlay" />
          <div className="event-hero-content">
            <div>
              <button className="back-btn" style={{ color:'rgba(255,255,255,.75)', marginBottom:8 }} onClick={() => navigate('/team')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
                My Events
              </button>
              <h1 style={{ color:'#fff', fontFamily:"'Playfair Display',Georgia,serif", fontSize:26, marginBottom:6 }}>{event?.name}</h1>
              <div style={{ display:'flex', gap:16, color:'rgba(255,255,255,.7)', fontSize:13, flexWrap:'wrap' }}>
                {event?.date && <span>📅 {new Date(event.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>}
                {event?.description && <span>📍 {event.description.slice(0,50)}</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {[['My Uploads', photos.length,'var(--gold-light)'],['Selected', selectedCount,'#4ade80']].map(([l,v,c]) => (
                <div key={l} style={{ textAlign:'center', background:'rgba(255,255,255,.12)', backdropFilter:'blur(10px)', padding:'10px 18px', borderRadius:'var(--r)', border:'1px solid rgba(255,255,255,.15)' }}>
                  <div style={{ color:c, fontSize:20, fontWeight:800 }}>{v}</div>
                  <div style={{ color:'rgba(255,255,255,.6)', fontSize:11 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTROLS ── */}
        <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'12px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <span style={{ fontSize:15, fontWeight:700 }}>My Uploaded Photos</span>
            <span className="badge badge-navy" style={{ marginLeft:10 }}>{photos.length}</span>
            {selectedCount > 0 && <span className="badge badge-gold" style={{ marginLeft:6 }}>{selectedCount} selected by admin</span>}
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => setShowUpload(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Photos
          </button>
        </div>

        {/* ── TEAM MEMBER NOTICE ── */}
        <div style={{ margin:'16px 28px 0', padding:'11px 14px', background:'var(--gold-pale)', borderRadius:'var(--r)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', gap:10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92650a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ fontSize:12, color:'#92650a' }}>
            You can view and upload your own photos. Gallery publishing and selection is managed by the Admin.
          </p>
        </div>

        <div style={{ padding:'20px 28px 40px' }}>
          {photos.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
              <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>No photos yet</h3>
              <p style={{ fontSize:14, color:'var(--text-mid)', marginBottom:20 }}>Start uploading your photos for this event</p>
              <button className="btn btn-primary" onClick={() => setShowUpload(true)}>Upload Photos</button>
            </div>
          ) : (
            <div className="photo-grid-lg">
              {photos.map(ph => (
                <div key={ph._id}
                  className="photo-card"
                  style={{ outline: ph.isSelected ? '3px solid var(--gold)' : 'none', outlineOffset:2 }}
                  onClick={() => openLightbox(ph)}>
                  {/* ── IMAGE SLOT 2: thumbnail ── */}
                  {ph.thumbnailUrl
                    ? <img src={ph.thumbnailUrl} alt={ph.filename} />
                    : <div style={{ width:'100%', height:'100%', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🖼</div>
                  }
                  <div className="photo-overlay" />
                  {ph.isSelected && (
                    <div style={{ position:'absolute', top:8, right:8, background:'var(--gold)', borderRadius:5, padding:'2px 6px', fontSize:9, fontWeight:800, color:'var(--navy)', zIndex:2 }}>
                      ✓ SELECTED
                    </div>
                  )}
                  <div className="photo-info">
                    <div className="photo-info-name">{ph.filename}</div>
                    <div className="photo-info-sub">
                      {new Date(ph.createdAt).toLocaleDateString('en-IN')}
                      {ph.fileSize ? ` · ${(ph.fileSize/1024/1024).toFixed(1)} MB` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── UPLOAD HISTORY TABLE ── */}
          {photos.length > 0 && (
            <div style={{ marginTop:32 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Upload History</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Photo</th><th>Filename</th><th>Size</th><th>Upload Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {photos.map(ph => (
                      <tr key={ph._id}>
                        <td>
                          {/* ── IMAGE SLOT: table thumbnail ── */}
                          <div style={{ width:40, height:40, borderRadius:8, background:'var(--surface)', overflow:'hidden', flexShrink:0 }}>
                            {ph.thumbnailUrl && <img src={ph.thumbnailUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                          </div>
                        </td>
                        <td style={{ fontWeight:500 }}>{ph.filename}</td>
                        <td style={{ color:'var(--text-soft)' }}>{ph.fileSize ? `${(ph.fileSize/1024/1024).toFixed(1)} MB` : '—'}</td>
                        <td style={{ color:'var(--text-soft)' }}>{new Date(ph.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                        <td>
                          <span className={`badge ${ph.isSelected ? 'badge-gold' : 'badge-gray'}`}>
                            {ph.isSelected ? '✓ Selected' : 'Uploaded'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-counter">{lightboxIdx + 1} / {photos.length}</div>
          <button className="lightbox-close btn btn-ghost btn-icon" style={{ color:'#fff' }} onClick={() => setLightbox(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {/* ── IMAGE SLOT: full-res lightbox ── */}
          <img className="lightbox-img" src={lightbox.storageUrl} alt={lightbox.filename} onClick={e => e.stopPropagation()} />
          <button className="lightbox-nav lightbox-nav-prev" onClick={e => { e.stopPropagation(); prev(); }}>‹</button>
          <button className="lightbox-nav lightbox-nav-next" onClick={e => { e.stopPropagation(); next(); }}>›</button>
          <div className="lightbox-actions">
            <div style={{ color:'rgba(255,255,255,.5)', fontSize:12, textAlign:'center' }}>
              {lightbox.filename} {lightbox.fileSize ? `· ${(lightbox.fileSize/1024/1024).toFixed(1)} MB` : ''}
            </div>
          </div>
        </div>
      )}

      <UploadModal open={showUpload} eventId={id} onClose={() => setShowUpload(false)} onUploaded={fetch} />
    </div>
  );
}
