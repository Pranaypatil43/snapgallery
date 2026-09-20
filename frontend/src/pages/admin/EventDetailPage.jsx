/**
 * EVENT DETAIL PAGE (Admin)
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * 1. EVENT HERO COVER:
 *    On .event-hero div add:
 *      style={{ backgroundImage: `url(${event.coverImageUrl || '/images/event-placeholder.jpg'})` }}
 *
 * 2. PHOTO THUMBNAILS (Photos tab):
 *    Each photo-card: use <img src={photo.thumbnailUrl} alt={photo.filename} />
 *    or set backgroundImage on the .photo-card div.
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, addMembers, removeMember, getTeamMembers } from '../../api/events';
import { getEventPhotos, deletePhoto } from '../../api/photos';
import { getGalleryByEvent } from '../../api/galleries';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import { PageSpinner } from '../../components/Spinner';
import { ConfirmModal } from '../../components/Modal';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event,     setEvent]    = useState(null);
  const [photos,    setPhotos]   = useState([]);
  const [gallery,   setGallery]  = useState(null);
  const [allMembers,setAllMembers]= useState([]);
  const [loading,   setLoading]  = useState(true);
  const [tab,       setTab]      = useState('overview');
  const [memberToAdd,setMemberToAdd]= useState('');
  const [deleteTarget,setDeleteTarget]= useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [evRes, photosRes] = await Promise.all([getEvent(id), getEventPhotos(id)]);
      setEvent(evRes.data.event);
      setPhotos(photosRes.data.photos);
      try { const g = await getGalleryByEvent(id); setGallery(g.data.gallery); } catch {}
      const memRes = await getTeamMembers(); setAllMembers(memRes.data.members);
    } catch (err) {
      toast.error('Failed to load event');
      if (err.response?.status === 403) navigate('/admin');
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeletePhoto = async () => {
    try {
      await deletePhoto(deleteTarget);
      setPhotos(p => p.filter(ph => ph._id !== deleteTarget));
      toast.success('Photo deleted');
    } catch { toast.error('Delete failed'); }
    finally { setDeleteTarget(null); }
  };

  const handleAddMember = async () => {
    if (!memberToAdd) return;
    try {
      await addMembers(id, [memberToAdd]);
      toast.success('Member added');
      setMemberToAdd('');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (mid) => {
    try { await removeMember(id, mid); toast.success('Member removed'); fetchAll(); }
    catch { toast.error('Failed to remove member'); }
  };

  if (loading) return <div className="app-shell"><AdminSidebar /><div className="main-content"><PageSpinner /></div></div>;
  if (!event)  return <div className="app-shell"><AdminSidebar /><div className="main-content" style={{display:'flex',alignItems:'center',justifyContent:'center',flex:1}}><p style={{color:'var(--text-soft)'}}>Event not found</p></div></div>;

  const assignedIds = new Set(event.teamMembers?.map(m => m._id.toString()) || []);
  const unassigned  = allMembers.filter(m => !assignedIds.has(m._id.toString()));
  const shareUrl    = gallery?.isPublished ? (gallery.shareUrl || `${window.location.origin}/gallery/${gallery.slug}`) : null;

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content overflow-y-auto">
        {/* ── HERO ── */}
        {/* ── IMAGE SLOT 1: add backgroundImage to event-hero ── */}
        <div className="event-hero" style={{ backgroundImage: event.coverImageUrl ? `url(${event.coverImageUrl})` : undefined }}>
          <div className="event-hero-overlay" />
          <div className="event-hero-content">
            <div>
              <button className="back-btn" style={{ color: 'rgba(255,255,255,.75)', marginBottom: 8 }} onClick={() => navigate('/admin/events')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <h1 style={{ color: '#fff', fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, marginBottom: 6 }}>{event.name}</h1>
              <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,.7)', fontSize: 13 }}>
                {event.date && <span>📅 {new Date(event.date).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</span>}
                {event.description && <span>📍 {event.description.slice(0,50)}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['Photos', photos.length],['Selected', gallery?.selectedPhotos?.length||0],['Team', event.teamMembers?.length||0]].map(([l,v]) => (
                <div key={l} style={{ textAlign:'center', background:'rgba(255,255,255,.12)', backdropFilter:'blur(10px)', padding:'10px 18px', borderRadius:'var(--r)', border:'1px solid rgba(255,255,255,.15)' }}>
                  <div style={{ color: l==='Selected'?'var(--gold-light)':'#fff', fontSize: 22, fontWeight: 800 }}>{v}</div>
                  <div style={{ color:'rgba(255,255,255,.6)', fontSize: 11 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ACTION BAR ── */}
        <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'12px 32px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div className="tabs">
            {['overview','photos','team','gallery'].map(t => (
              <button key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
            {tab==='photos' && (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/events/${id}/photos`)}>
                  Manage Photos
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/events/${id}/select`)}>
                  Select for Gallery
                </button>
              </>
            )}
            {gallery && !gallery.isPublished && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/events/${id}/publish`)}>
                Publish Gallery →
              </button>
            )}
          </div>
        </div>

        <div className="page-body-sm" style={{ flex:1, overflowY:'auto' }}>

          {/* ── OVERVIEW TAB ── */}
          {tab==='overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              <div className="card" style={{ padding:20 }}>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Event Information</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[['Name',event.name],['Date',event.date?new Date(event.date).toLocaleDateString('en-IN'):'-'],['Description',event.description||'-']].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'var(--text-soft)', fontWeight:500 }}>{k}</span>
                      <span style={{ color:'var(--text)', fontWeight:500, textAlign:'right', maxWidth:'60%' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {gallery ? (
                <div className="card" style={{ padding:20 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Gallery Status</h3>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <span className={`badge ${gallery.isPublished?'badge-green':'badge-amber'}`}>
                      {gallery.isPublished?'● Published':'● Draft'}
                    </span>
                    <span style={{ fontSize:13, color:'var(--text-soft)' }}>{gallery.selectedPhotos?.length||0} photos selected</span>
                  </div>
                  {shareUrl && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-soft)', marginBottom:4 }}>Gallery URL</div>
                      <div style={{ fontSize:12, color:'var(--navy-light)', wordBreak:'break-all' }}>{shareUrl}</div>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8 }}>
                    {!gallery.isPublished && <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/events/${id}/publish`)}>Publish Gallery</button>}
                    {shareUrl && <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success('Link copied!'); }}>Copy Link</button>}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding:20 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Gallery</h3>
                  <p style={{ fontSize:13, color:'var(--text-soft)', marginBottom:14 }}>No gallery created yet. Select photos to create one.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/events/${id}/select`)}>Select Photos for Gallery</button>
                </div>
              )}
            </div>
          )}

          {/* ── PHOTOS TAB ── */}
          {tab==='photos' && (
            <>
              {photos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
                  <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>No photos yet</h3>
                  <p style={{ fontSize:14, color:'var(--text-mid)', marginBottom:20 }}>Team members need to upload photos for this event.</p>
                </div>
              ) : (
                <div className="photo-grid-lg">
                  {/* ── IMAGE SLOT 2: thumbnails ── */}
                  {photos.map(ph => (
                    <div key={ph._id} className="photo-card">
                      {ph.thumbnailUrl && <img src={ph.thumbnailUrl} alt={ph.filename} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />}
                      <div className="photo-overlay" />
                      <div className="photo-info">
                        <div className="photo-info-name">{ph.filename}</div>
                        <div className="photo-info-sub">{ph.uploadedBy?.name}</div>
                      </div>
                      <div className="photo-actions">
                        <button className="photo-action-btn" onClick={() => setDeleteTarget(ph._id)} title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── TEAM TAB ── */}
          {tab==='team' && (
            <div style={{ maxWidth:600 }}>
              {unassigned.length > 0 && (
                <div className="card" style={{ padding:20, marginBottom:20 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Add Team Member</h3>
                  <div style={{ display:'flex', gap:10 }}>
                    <select className="input" value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)} style={{ flex:1 }}>
                      <option value="">— Select a member —</option>
                      {unassigned.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={handleAddMember} disabled={!memberToAdd}>Add</button>
                  </div>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {event.teamMembers?.length === 0 ? (
                  <p style={{ fontSize:14, color:'var(--text-soft)', padding:'20px 0' }}>No team members assigned yet.</p>
                ) : event.teamMembers?.map(m => (
                  <div key={m._id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                    <div className="avatar avatar-md">{m.name[0].toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{m.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-soft)' }}>{m.email}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m._id)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GALLERY TAB ── */}
          {tab==='gallery' && (
            <div style={{ maxWidth:700 }}>
              {gallery ? (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div className="card" style={{ padding:24 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                      <h3 style={{ fontSize:16, fontWeight:700 }}>{gallery.title}</h3>
                      <span className={`badge ${gallery.isPublished?'badge-green':'badge-amber'}`}>{gallery.isPublished?'Published':'Draft'}</span>
                    </div>
                    <p style={{ fontSize:14, color:'var(--text-mid)', marginBottom:16 }}>{gallery.selectedPhotos?.length||0} photos selected for this gallery.</p>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/events/${id}/select`)}>Edit Selection</button>
                      {!gallery.isPublished && <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/events/${id}/publish`)}>Publish Gallery</button>}
                      {shareUrl && <button className="btn btn-gold btn-sm" onClick={() => window.open(shareUrl,'_blank')}>Open Gallery ↗</button>}
                      {shareUrl && <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success('Copied!'); }}>Copy Link</button>}
                    </div>
                  </div>
                  {/* Preview grid */}
                  {gallery.selectedPhotos?.length > 0 && (
                    <div className="photo-grid-sm">
                      {gallery.selectedPhotos.slice(0,12).map(ph => (
                        <div key={ph._id || ph} className="photo-card">
                          {/* ── IMAGE SLOT: gallery preview thumbnails ── */}
                          {ph.thumbnailUrl && <img src={ph.thumbnailUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'60px 0' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🖼</div>
                  <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>No gallery yet</h3>
                  <p style={{ fontSize:14, color:'var(--text-mid)', marginBottom:20 }}>Select photos to build your gallery</p>
                  <button className="btn btn-primary" onClick={() => navigate(`/admin/events/${id}/select`)}>Select Photos →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeletePhoto}
        title="Delete Photo" message="This photo will be permanently deleted. This cannot be undone."
        confirmLabel="Delete" danger />
    </div>
  );
}
