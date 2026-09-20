/**
 * PUBLISH GALLERY PAGE (Admin)
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * SELECTED PHOTO PREVIEWS (left column):
 *   Each preview card: <img src={photo.thumbnailUrl} alt={photo.filename} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getGalleryByEvent, createGallery, publishGallery } from '../../api/galleries';
import { getEvent } from '../../api/events';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import { PageSpinner } from '../../components/Spinner';
import Spinner from '../../components/Spinner';

const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

export default function PublishGalleryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // selectedPhotoIds passed from GallerySelectPage via route state (no dummy-PIN write)
  const incomingIds = location.state?.selectedPhotoIds ?? null;

  const [event,   setEvent]   = useState(null);
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [published, setPublished] = useState(false);
  const [shareUrl,  setShareUrl]  = useState('');
  const [form, setForm] = useState({ title: '', description: '', pin: generatePin() });

  const fetch = useCallback(async () => {
    try {
      const evRes = await getEvent(id);
      setEvent(evRes.data.event);
      setForm(p => ({ ...p, title: evRes.data.event.name }));
      // Only load the saved gallery if we don't have fresh selection from route state
      if (!incomingIds) {
        try { const g = await getGalleryByEvent(id); setGallery(g.data.gallery); } catch {}
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [id, incomingIds]);

  useEffect(() => { fetch(); }, [fetch]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // The photo IDs to use: prefer fresh selection from route state
  const selectedPhotoIds = incomingIds ?? (gallery?.selectedPhotos?.map(p => p._id || p) ?? []);

  const handlePublish = async () => {
    if (!form.title.trim()) { toast.error('Gallery name is required'); return; }
    if (form.pin.length < 4) { toast.error('PIN must be at least 4 characters'); return; }
    if (selectedPhotoIds.length === 0) { toast.error('No photos selected. Go back and select photos first.'); return; }
    setSaving(true);
    try {
      // Save/update gallery with real PIN — only write happens here
      const saved = await createGallery({
        eventId: id,
        title: form.title,
        description: form.description,
        selectedPhotos: selectedPhotoIds,
        pin: form.pin,
      });
      // Publish it
      const pub = await publishGallery(saved.data.gallery._id);
      setShareUrl(pub.data.shareUrl || `${window.location.origin}/gallery/${pub.data.gallery.slug}`);
      setPublished(true);
      toast.success('Gallery published successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to publish gallery'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="app-shell"><AdminSidebar /><div className="main-content"><PageSpinner /></div></div>;

  // ── SUCCESS STATE ──
  if (published) {
    return (
      <div className="app-shell">
        <AdminSidebar />
        <div className="main-content" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'100%', maxWidth:520, padding:'0 24px' }}>
            <div className="publish-success">
              <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontSize:26, fontWeight:800, marginBottom:8 }}>Gallery Published!</h2>
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:15, marginBottom:28 }}>
                Share the link and PIN with your client
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Gallery URL</div>
                  <div className="publish-url-box">{shareUrl}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Access PIN</div>
                  <div className="pin-display">{form.pin}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                <button className="btn btn-outline" style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)' }} onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success('Link copied!'); }}>Copy Link</button>
                <button className="btn btn-outline" style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)' }} onClick={() => { navigator.clipboard?.writeText(form.pin); toast.success('PIN copied!'); }}>Copy PIN</button>
                <button className="btn btn-gold" onClick={() => window.open(shareUrl,'_blank')}>Open Gallery ↗</button>
              </div>
            </div>
            <div style={{ textAlign:'center', marginTop:20 }}>
              <button className="btn btn-ghost" style={{ color:'var(--text-mid)' }} onClick={() => navigate('/admin/galleries')}>
                View all galleries →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const previewPhotos = gallery?.selectedPhotos?.slice(0, 8) || [];

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content overflow-y-auto">
        <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="back-btn" style={{ marginBottom:0 }} onClick={() => navigate(`/admin/events/${id}/select`)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <span style={{ fontSize:16, fontWeight:700 }}>Publish Gallery</span>
          </div>
          <span style={{ fontSize:13, color:'var(--text-soft)' }}>{event?.name}</span>
        </div>

        <div className="page-body" style={{ flex:1, overflowY:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:28, maxWidth:1100 }}>
            {/* Left: preview */}
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>
                Selected Photos
                <span className="badge badge-navy" style={{ marginLeft:10, fontSize:12 }}>{selectedPhotoIds.length}</span>
              </h3>
              {previewPhotos.length > 0 ? (
                <div className="photo-grid">
                  {/* ── IMAGE SLOT: preview thumbnails ── */}
                  {previewPhotos.map(ph => (
                    <div key={ph._id || ph} className="photo-card" style={{ aspectRatio:'1' }}>
                      {ph.thumbnailUrl && <img src={ph.thumbnailUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
                    </div>
                  ))}
                  {selectedPhotoIds.length > 8 && (
                    <div className="photo-card" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', aspectRatio:'1' }}>
                      <span style={{ fontSize:15, fontWeight:800, color:'var(--text-mid)' }}>+{selectedPhotoIds.length - 8}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding:'40px 0', textAlign:'center', color:'var(--text-soft)' }}>
                  {selectedPhotoIds.length > 0
                    ? <p>{selectedPhotoIds.length} photos selected. Thumbnails will show after saving.</p>
                    : <>
                        <p>No photos selected yet.</p>
                        <button className="btn btn-primary btn-sm" style={{ marginTop:12 }} onClick={() => navigate(`/admin/events/${id}/select`)}>Select Photos</button>
                      </>
                  }
                </div>
              )}
            </div>

            {/* Right: publish form */}
            <div className="card" style={{ padding:28, height:'fit-content', position:'sticky', top:24 }}>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>Gallery Settings</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="input-group">
                  <label className="input-label">Gallery Name <span style={{color:'var(--red)'}}>*</span></label>
                  <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Arjun & Priya Wedding" />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional gallery description…" />
                </div>
                <div className="input-group">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <label className="input-label">Access PIN <span style={{color:'var(--red)'}}>*</span></label>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:'2px 8px' }} onClick={() => set('pin', generatePin())}>
                      Generate
                    </button>
                  </div>
                  <input className={`input pin-input`} value={form.pin} onChange={e => set('pin', e.target.value)} maxLength={10} />
                  <span className="input-hint">Share this PIN with your client to access the gallery</span>
                </div>

                {/* Summary */}
                <div style={{ padding:'12px 14px', background:'var(--gold-pale)', borderRadius:'var(--r)', border:'1px solid var(--gold-border)' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#92650a', marginBottom:4 }}>Ready to publish</div>
                  <div style={{ fontSize:12, color:'#92650a' }}>
                    {selectedPhotoIds.length} photos · PIN: {form.pin}
                  </div>
                </div>

                <button className="btn btn-gold btn-lg w-full" onClick={handlePublish} disabled={saving}>
                  {saving ? <Spinner size="sm" /> : '🚀 Publish Gallery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
