/**
 * CUSTOMER GALLERY PAGE (Public — no login required)
 * Handles both PIN verification and the full gallery view.
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * 1. PIN PAGE BACKGROUND:
 *    On .pin-page div add:
 *      style={{ backgroundImage: 'url(/images/gallery-bg.jpg)' }}
 *    Use a beautiful, blurred wedding/event photograph (1920×1080px).
 *    The dark overlay (.pin-page-overlay) ensures readability.
 *
 * 2. GALLERY PHOTOS (masonry grid):
 *    Each .masonry-grid-item:
 *      <img src={photo.storageUrl} alt={photo.filename} />
 *    Use photo.storageUrl from Cloudinary for full-quality display.
 *    Use photo.thumbnailUrl for fast initial load (lazy loading).
 *
 * 3. LIGHTBOX FULL IMAGE:
 *    <img src={currentPhoto.storageUrl} alt={currentPhoto.filename} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getPublicGalleryInfo, verifyGalleryPin } from '../api/galleries';
import Spinner from '../components/Spinner';

/* ── Error / empty states ─────────────────────────── */
function GalleryError({ icon, title, message }) {
  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:24, padding:'48px 40px', maxWidth:400, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:16 }}>{icon}</div>
        <h2 style={{ color:'#fff', fontSize:22, fontWeight:800, marginBottom:8 }}>{title}</h2>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:14 }}>{message}</p>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { slug } = useParams();
  const location = useLocation();

  /* ── State machine: loading → pin → gallery | error ── */
  const [stage,     setStage]   = useState('loading');
  const [info,      setInfo]    = useState(null);
  const [gallery,   setGallery] = useState(null);
  const [errorMsg,  setErrorMsg]= useState('');
  const [pin,       setPin]     = useState('');
  const [pinError,  setPinError]= useState('');
  const [verifying, setVerifying] = useState(false);
  const [lightbox,  setLightbox]  = useState(null);
  const [lbIdx,     setLbIdx]     = useState(0);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    // If navigated from the login page PIN form — skip the PIN step entirely
    if (location.state?.verified && location.state?.gallery) {
      setGallery(location.state.gallery);
      setStage('gallery');
      return;
    }
    getPublicGalleryInfo(slug)
      .then(res => { setInfo(res.data.gallery); setStage('pin'); })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Gallery not found');
        setStage('error');
      });
  }, [slug]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pin.trim()) { setPinError('Please enter the PIN'); return; }
    setPinError(''); setVerifying(true);
    try {
      const res = await verifyGalleryPin(slug, pin);
      setGallery(res.data.gallery);
      setStage('gallery');
    } catch (err) {
      setPinError(err.response?.data?.message || 'Incorrect PIN. Please try again.');
      setPin('');
    } finally { setVerifying(false); }
  };

  const photos = gallery?.selectedPhotos || [];
  const filtered = photos.filter(p => !search || p.filename?.toLowerCase().includes(search.toLowerCase()));

  const openLightbox = (ph, idx) => { setLightbox(ph); setLbIdx(idx); };
  const lbPrev = () => { const i = (lbIdx - 1 + filtered.length) % filtered.length; setLightbox(filtered[i]); setLbIdx(i); };
  const lbNext = () => { const i = (lbIdx + 1) % filtered.length; setLightbox(filtered[i]); setLbIdx(i); };

  // Handle keyboard nav for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const h = (e) => { if (e.key === 'ArrowLeft') lbPrev(); if (e.key === 'ArrowRight') lbNext(); if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lightbox, lbIdx]);

  /* ── LOADING ── */
  if (stage === 'loading') {
    return (
      <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Spinner size="lg" white />
      </div>
    );
  }

  /* ── ERROR STATES ── */
  if (stage === 'error') {
    const isNotFound  = errorMsg.toLowerCase().includes('not found');
    const isExpired   = errorMsg.toLowerCase().includes('expired');
    const isNotPublished = errorMsg.toLowerCase().includes('not published') || errorMsg.toLowerCase().includes('not available');
    if (isExpired)      return <GalleryError icon="⏰" title="Gallery Expired"    message="This gallery link has expired. Please contact the photographer." />;
    if (isNotPublished) return <GalleryError icon="🔒" title="Not Available Yet"  message="This gallery hasn't been published yet. Please check back later." />;
    return <GalleryError icon="🚫" title="Gallery Not Found" message={errorMsg} />;
  }

  /* ── PIN VERIFICATION ── */
  if (stage === 'pin') {
    return (
      <div className="pin-page" style={{
        /* ── IMAGE SLOT 1: add backgroundImage here ── */
        backgroundImage: undefined,
      }}>
        <div className="pin-page-overlay" />
        <div className="pin-card" style={{ margin: '0 24px' }}>
          {/* Card header */}
          <div className="pin-card-header">
            {/* Logo */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:36, background:'linear-gradient(135deg,var(--gold),var(--gold-light))', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2.5">
                  <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </div>
              <span style={{ color:'#fff', fontSize:18, fontWeight:800 }}>SnapGallery</span>
            </div>

            {/* Event title */}
            <h1 style={{ color:'#fff', fontFamily:"'Playfair Display',Georgia,serif", fontSize:26, lineHeight:1.2, marginBottom:8 }}>
              {info?.title || info?.event?.name || 'Gallery'}
            </h1>
            {info?.event?.name && (
              <p style={{ color:'rgba(255,255,255,.6)', fontSize:13 }}>{info.event.name}</p>
            )}
          </div>

          {/* PIN form */}
          <div style={{ padding:'28px 32px' }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ width:52, height:52, background:'var(--off-white)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', border:'2px solid var(--border)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Enter your gallery PIN</h3>
              <p style={{ fontSize:13, color:'var(--text-soft)' }}>This gallery is private and protected</p>
            </div>

            <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <input
                type="text"
                className="input pin-input"
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError(''); }}
                placeholder="_ _ _ _ _ _"
                maxLength={10}
                autoFocus
                autoComplete="off"
              />

              {/* Error state */}
              {pinError && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:'var(--r)', fontSize:13, color:'var(--red)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {pinError}
                </div>
              )}

              {/* Verifying state */}
              {verifying && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', background:'var(--navy-50)', border:'1px solid #bfdbfe', borderRadius:'var(--r)', fontSize:13, color:'var(--navy)' }}>
                  <Spinner size="sm" /> Verifying PIN…
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={!pin.trim() || verifying}>
                {verifying ? <Spinner size="sm" white /> : 'View Gallery'}
              </button>
            </form>

            <p style={{ textAlign:'center', fontSize:11, color:'var(--text-soft)', marginTop:20 }}>
              Your gallery is protected by a private access PIN.<br />
              No account required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── GALLERY VIEW ── */
  return (
    <div className="gallery-page">
      {/* Header */}
      <header className="gallery-header">
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg,var(--gold),var(--gold-light))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2.5">
                <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
            <span style={{ color:'#fff', fontSize:15, fontWeight:800 }}>SnapGallery</span>
          </div>
          <span style={{ color:'rgba(255,255,255,.3)', fontSize:18 }}>/</span>
          <div>
            <div style={{ color:'#fff', fontSize:15, fontWeight:700 }}>{gallery.title}</div>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:11 }}>
              {gallery.eventId?.name}
              {gallery.publishedAt ? ` · ${new Date(gallery.publishedAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}` : ''}
              {` · ${photos.length} photos`}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,.4)', width:14, height:14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'var(--r)', padding:'8px 12px 8px 30px', color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', width:200 }}
              placeholder="Search photos…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Fullscreen */}
          <button
            style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'var(--r)', padding:8, color:'rgba(255,255,255,.7)', cursor:'pointer' }}
            onClick={() => document.documentElement.requestFullscreen?.()}
            title="Fullscreen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
          </button>
        </div>
      </header>

      {/* ── PHOTO GRID ── */}
      <div style={{ padding:'24px 28px 40px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,.4)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🖼</div>
            <p style={{ fontSize:16 }}>{search ? 'No photos match your search.' : 'No photos available in this gallery.'}</p>
          </div>
        ) : (
          /* ── MASONRY GRID ── */
          <div className="masonry-grid">
            {filtered.map((ph, idx) => (
              <div key={ph._id} className="masonry-grid-item" onClick={() => openLightbox(ph, idx)}>
                {/*
                  ── IMAGE SLOT 2: gallery photo ──
                  Replace div with:
                  <img
                    src={ph.thumbnailUrl || ph.storageUrl}
                    alt={ph.filename}
                    loading="lazy"
                  />
                */}
                {ph.thumbnailUrl || ph.storageUrl ? (
                  <img
                    src={ph.thumbnailUrl || ph.storageUrl}
                    alt={ph.filename}
                    loading="lazy"
                    style={{ width:'100%', display:'block' }}
                  />
                ) : (
                  <div style={{ height:200, background:'rgba(255,255,255,.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🖼</div>
                )}
                {/* Hover overlay */}
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', opacity:0, transition:'opacity .2s', display:'flex', alignItems:'center', justifyContent:'center' }}
                  className="masonry-hover-overlay">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', padding:'16px 0 28px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
        <p style={{ color:'rgba(255,255,255,.25)', fontSize:12 }}>
          Powered by <strong style={{ color:'rgba(255,255,255,.4)' }}>SnapGallery</strong> · Private Gallery · Protected by PIN
        </p>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <div className="lightbox-counter">{lbIdx + 1} / {filtered.length}</div>
          <button className="lightbox-close btn btn-ghost btn-icon" style={{ color:'#fff' }} onClick={() => setLightbox(null)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {/* ── IMAGE SLOT 3: full-res lightbox ── */}
          {lightbox.storageUrl && (
            <img
              className="lightbox-img"
              src={lightbox.storageUrl}
              alt={lightbox.filename}
              onClick={e => e.stopPropagation()}
            />
          )}
          <button className="lightbox-nav lightbox-nav-prev" onClick={e => { e.stopPropagation(); lbPrev(); }}>‹</button>
          <button className="lightbox-nav lightbox-nav-next" onClick={e => { e.stopPropagation(); lbNext(); }}>›</button>
          <div className="lightbox-actions" style={{ flexDirection:'column', alignItems:'center', gap:6 }}>
            <a
              href={lightbox.storageUrl}
              download={lightbox.filename}
              className="btn btn-outline btn-sm"
              style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)' }}
              onClick={e => e.stopPropagation()}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </a>
            <p style={{ color:'rgba(255,255,255,.3)', fontSize:11 }}>{lightbox.filename}</p>
          </div>
        </div>
      )}

      {/* Hover effect for masonry items */}
      <style>{`
        .masonry-grid-item:hover .masonry-hover-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
