/**
 * GALLERY SELECTION PAGE (Admin)
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * PHOTO THUMBNAILS:
 *   <img src={photo.thumbnailUrl} alt={photo.filename} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../../api/events';
import { getEventPhotos } from '../../api/photos';
import { getGalleryByEvent } from '../../api/galleries';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import { PageSpinner } from '../../components/Spinner';

export default function GallerySelectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event,   setEvent]   = useState(null);
  const [photos,  setPhotos]  = useState([]);
  const [selected,setSelected]= useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const fetch = useCallback(async () => {
    try {
      const [evRes, phRes] = await Promise.all([getEvent(id), getEventPhotos(id)]);
      setEvent(evRes.data.event);
      setPhotos(phRes.data.photos);
      try {
        const galRes = await getGalleryByEvent(id);
        setSelected(new Set(galRes.data.gallery.selectedPhotos.map(p => p._id || p)));
      } catch {}
    } catch { toast.error('Failed to load photos'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = (photoId) => {
    setSelected(prev => { const n = new Set(prev); n.has(photoId) ? n.delete(photoId) : n.add(photoId); return n; });
  };
  const selectAll = () => setSelected(new Set(filtered.map(p => p._id)));
  const clearAll  = () => setSelected(new Set());

  const filtered = photos.filter(p => p.filename.toLowerCase().includes(search.toLowerCase()) || p.uploadedBy?.name?.toLowerCase().includes(search.toLowerCase()));

  const handleContinue = () => {
    if (selected.size === 0) { toast.error('Select at least one photo'); return; }
    // Pass selection via route state — no dummy PIN write to the database
    navigate(`/admin/events/${id}/publish`, {
      state: { selectedPhotoIds: Array.from(selected) },
    });
  };

  if (loading) return <div className="app-shell"><AdminSidebar /><div className="main-content"><PageSpinner /></div></div>;

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content" style={{ display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ background: 'var(--navy)', padding: '20px 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="back-btn" style={{ color:'rgba(255,255,255,.75)', marginBottom: 0 }} onClick={() => navigate(`/admin/events/${id}`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <div>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Select Photos for Gallery</h1>
                <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, marginTop: 2 }}>{event?.name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[['Total', photos.length, 'rgba(255,255,255,.6)'],['Selected', selected.size, 'var(--gold-light)']].map(([l,v,c]) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{ color: c, fontSize: 22, fontWeight: 800 }}>{v}</div>
                  <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'12px 32px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <label className="checkbox-wrap" onClick={selected.size === filtered.length ? clearAll : selectAll}>
            <div className={`checkbox ${selected.size === filtered.length && filtered.length > 0 ? 'checked' : selected.size > 0 ? 'indeterminate' : ''}`}>
              {selected.size === filtered.length && filtered.length > 0
                ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                : selected.size > 0 ? <span style={{width:8,height:2,background:'#fff',borderRadius:2,display:'block'}}/>
                : null}
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
              {selected.size === filtered.length && filtered.length > 0 ? `Deselect all (${filtered.length})` : `Select all (${filtered.length})`}
            </span>
          </label>
          {selected.size > 0 && <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={clearAll}>Clear selection</button>}
          <div style={{ width:1, height:20, background:'var(--border)', margin:'0 4px' }} />
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Search photos…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 32px 120px' }}>
          <div className="photo-grid-lg">
            {filtered.map(ph => {
              const isSelected = selected.has(ph._id);
              return (
                <div key={ph._id}
                  className={`photo-card ${isSelected ? 'photo-selected-ring' : ''}`}
                  style={{ outline: isSelected ? '3px solid var(--navy)' : 'none', outlineOffset: 2 }}
                  onClick={() => toggle(ph._id)}>
                  {/* ── IMAGE SLOT: thumbnail ── */}
                  {ph.thumbnailUrl
                    ? <img src={ph.thumbnailUrl} alt={ph.filename} />
                    : <div style={{width:'100%',height:'100%',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>🖼</div>
                  }
                  <div className="photo-overlay" />
                  <div className={`photo-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
                  </div>
                  <div className="photo-info">
                    <div className="photo-info-name">{ph.filename}</div>
                    <div className="photo-info-sub">{ph.uploadedBy?.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="action-bar">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,.1)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="2"><path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div>
              <div style={{ color:'#fff', fontSize:15, fontWeight:700 }}>{selected.size} photo{selected.size!==1?'s':''} selected</div>
              <div style={{ color:'rgba(255,255,255,.55)', fontSize:12 }}>Ready to build your gallery</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-outline" style={{ color:'#fff', borderColor:'rgba(255,255,255,.25)' }} onClick={() => navigate(`/admin/events/${id}`)}>Cancel</button>
            <button className="btn btn-gold btn-lg" onClick={handleContinue} disabled={selected.size===0}>
              Continue to Publish →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
