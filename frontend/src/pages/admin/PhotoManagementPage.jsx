/**
 * PHOTO MANAGEMENT PAGE (Admin)
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * PHOTO THUMBNAILS:
 *   Each photo-card: <img src={photo.thumbnailUrl} alt={photo.filename} />
 *   Full images (lightbox): <img src={photo.storageUrl} alt={photo.filename} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../../api/events';
import { getEventPhotos, deletePhoto } from '../../api/photos';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import { PageSpinner } from '../../components/Spinner';
import { ConfirmModal } from '../../components/Modal';

export default function PhotoManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event,   setEvent]   = useState(null);
  const [photos,  setPhotos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filterMember, setFilterMember] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const [evRes, photosRes] = await Promise.all([getEvent(id), getEventPhotos(id)]);
      setEvent(evRes.data.event); setPhotos(photosRes.data.photos);
    } catch { toast.error('Failed to load photos'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = photos.filter(p => {
    const matchSearch = p.filename.toLowerCase().includes(search.toLowerCase()) || p.uploadedBy?.name?.toLowerCase().includes(search.toLowerCase());
    const matchMember = filterMember === 'all' || p.uploadedBy?._id === filterMember;
    return matchSearch && matchMember;
  });

  const members = [...new Map(photos.map(p => [p.uploadedBy?._id, p.uploadedBy]).filter(([k]) => k)).values()];

  const openLightbox = (photo) => {
    setLightbox(photo);
    setLightboxIdx(filtered.findIndex(p => p._id === photo._id));
  };
  const prevPhoto = () => { const i = (lightboxIdx - 1 + filtered.length) % filtered.length; setLightbox(filtered[i]); setLightboxIdx(i); };
  const nextPhoto = () => { const i = (lightboxIdx + 1) % filtered.length; setLightbox(filtered[i]); setLightboxIdx(i); };

  const handleDelete = async () => {
    try {
      await deletePhoto(deleteTarget);
      setPhotos(p => p.filter(ph => ph._id !== deleteTarget));
      toast.success('Photo deleted');
    } catch { toast.error('Delete failed'); }
    finally { setDeleteTarget(null); }
  };

  if (loading) return <div className="app-shell"><AdminSidebar /><div className="main-content"><PageSpinner /></div></div>;

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        {/* Top controls */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button className="back-btn" onClick={() => navigate(`/admin/events/${id}`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
            {event?.name}
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Photo Management</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="search-wrap">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="search-input" placeholder="Search photos…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input" style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }} value={filterMember} onChange={e => setFilterMember(e.target.value)}>
              <option value="all">All photographers</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/events/${id}/select`)}>
              Select for Gallery
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ background: 'var(--off-white)', borderBottom: '1px solid var(--border)', padding: '10px 28px', display: 'flex', gap: 24, fontSize: 13 }}>
          <span><strong style={{ color: 'var(--navy)' }}>{photos.length}</strong> <span style={{ color: 'var(--text-soft)' }}>total photos</span></span>
          <span><strong style={{ color: 'var(--navy)' }}>{filtered.length}</strong> <span style={{ color: 'var(--text-soft)' }}>showing</span></span>
          <span><strong style={{ color: 'var(--navy)' }}>{members.length}</strong> <span style={{ color: 'var(--text-soft)' }}>photographers</span></span>
        </div>

        {/* Photo grid */}
        <div className="page-body-sm" style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>No photos found</h3>
              <p style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>Try a different filter or upload some photos.</p>
            </div>
          ) : (
            <div className="photo-grid-lg">
              {filtered.map(ph => (
                <div key={ph._id} className="photo-card" onClick={() => openLightbox(ph)}>
                  {/* ── IMAGE SLOT: thumbnail ── */}
                  {ph.thumbnailUrl
                    ? <img src={ph.thumbnailUrl} alt={ph.filename} />
                    : <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🖼</div>
                  }
                  <div className="photo-overlay" />
                  <div className="photo-info">
                    <div className="photo-info-name">{ph.filename}</div>
                    <div className="photo-info-sub">{ph.uploadedBy?.name} · {ph.fileSize ? `${(ph.fileSize/1024/1024).toFixed(1)} MB` : ''}</div>
                  </div>
                  <div className="photo-actions">
                    <button className="photo-action-btn" onClick={e => { e.stopPropagation(); setDeleteTarget(ph._id); }} title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-counter">{lightboxIdx + 1} / {filtered.length}</div>
          <button className="lightbox-close btn btn-ghost btn-icon" style={{ color: '#fff' }} onClick={() => setLightbox(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {/* ── IMAGE SLOT: full-res lightbox image ── */}
          <img className="lightbox-img" src={lightbox.storageUrl} alt={lightbox.filename} onClick={e => e.stopPropagation()} />
          <button className="lightbox-nav lightbox-nav-prev" onClick={e => { e.stopPropagation(); prevPhoto(); }}>‹</button>
          <button className="lightbox-nav lightbox-nav-next" onClick={e => { e.stopPropagation(); nextPhoto(); }}>›</button>
          <div className="lightbox-actions">
            <a href={lightbox.storageUrl} download={lightbox.filename} className="btn btn-outline btn-sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)' }} onClick={e => e.stopPropagation()}>
              ↓ Download
            </a>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Photo" message="This photo will be permanently deleted." confirmLabel="Delete" danger />
    </div>
  );
}
