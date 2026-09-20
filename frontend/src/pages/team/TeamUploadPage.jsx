/**
 * TEAM UPLOAD PAGE — pick an event then upload photos to it
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getEvents } from '../../api/events';
import { uploadPhotos } from '../../api/photos';
import { toast } from '../../components/Toast';
import { TeamSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function TeamUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('event');

  const [events,      setEvents]      = useState([]);
  const [evLoading,   setEvLoading]   = useState(true);
  const [eventId,     setEventId]     = useState(preselectedEventId || '');
  const [files,       setFiles]       = useState([]);
  const [previews,    setPreviews]    = useState([]);
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [dragOver,    setDragOver]    = useState(false);
  const inputRef = useRef(null);

  const fetchEvents = useCallback(async () => {
    try { const r = await getEvents(); setEvents(r.data.events || []); }
    catch { toast.error('Failed to load events'); }
    finally { setEvLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* Build object-URL previews whenever files change */
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    if (valid.length !== incoming.length) toast.error('Only image files are accepted');
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!eventId)       { toast.error('Please select an event'); return; }
    if (files.length === 0) { toast.error('Add at least one photo'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('photos', f));
      await uploadPhotos(eventId, fd, setProgress);
      toast.success(`${files.length} photo${files.length !== 1 ? 's' : ''} uploaded!`);
      setFiles([]);
      navigate(`/team/events/${eventId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const selectedEvent = events.find(e => e._id === eventId);

  return (
    <div className="app-shell">
      <TeamSidebar />
      <div className="main-content">
        <Topbar title="Upload Photos" subtitle="Add photos to your assigned events" />
        <div className="page-body">
          <div style={{ maxWidth:760, margin:'0 auto' }}>

            {/* Step 1 — pick event */}
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>
                <span style={{ background:'var(--navy)', color:'#fff', borderRadius:'50%', width:24, height:24, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, marginRight:10 }}>1</span>
                Select Event
              </h3>
              {evLoading ? <PageSpinner /> : events.length === 0 ? (
                <EmptyState icon="📋" title="No events assigned" description="Ask your Admin to assign you to an event." />
              ) : (
                <select
                  className="input"
                  style={{ width:'100%' }}
                  value={eventId}
                  onChange={e => setEventId(e.target.value)}
                >
                  <option value="">— Choose an event —</option>
                  {events.map(ev => (
                    <option key={ev._id} value={ev._id}>
                      {ev.name}{ev.date ? ` · ${new Date(ev.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}` : ''}
                    </option>
                  ))}
                </select>
              )}
              {selectedEvent && (
                <div style={{ marginTop:12, padding:'10px 14px', background:'var(--navy-50)', borderRadius:'var(--r)', fontSize:13, color:'var(--navy)' }}>
                  📅 Uploading to: <strong>{selectedEvent.name}</strong>
                </div>
              )}
            </div>

            {/* Step 2 — pick files */}
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>
                <span style={{ background:'var(--navy)', color:'#fff', borderRadius:'50%', width:24, height:24, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, marginRight:10 }}>2</span>
                Add Photos
              </h3>

              {/* Drop zone */}
              <div
                style={{
                  border: `2px dashed ${dragOver ? 'var(--navy)' : 'var(--border)'}`,
                  borderRadius:'var(--r)', padding:'36px 24px', textAlign:'center',
                  background: dragOver ? 'var(--navy-50)' : 'var(--off-white)',
                  transition:'all .2s', cursor:'pointer',
                }}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" strokeWidth="1.5" style={{ marginBottom:12 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:4 }}>
                  Drag &amp; drop photos here
                </p>
                <p style={{ fontSize:13, color:'var(--text-soft)' }}>or click to browse · JPG, PNG, WEBP · max 20 files</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display:'none' }}
                  onChange={e => addFiles(e.target.files)}
                />
              </div>

              {/* Preview grid */}
              {files.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:14, fontWeight:600 }}>{files.length} photo{files.length !== 1 ? 's' : ''} ready</span>
                    <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)' }} onClick={() => setFiles([])}>Clear all</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:8 }}>
                    {previews.map((url, i) => (
                      <div key={i} style={{ position:'relative', aspectRatio:'1', borderRadius:8, overflow:'hidden', background:'var(--surface)' }}>
                        <img src={url} alt={files[i].name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        <button
                          onClick={() => removeFile(i)}
                          style={{ position:'absolute', top:4, right:4, background:'rgba(0,0,0,.6)', border:'none', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:12, lineHeight:1 }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {uploading && (
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:'var(--text)' }}>Uploading…</span>
                  <span style={{ fontWeight:700, color:'var(--navy)' }}>{progress}%</span>
                </div>
                <div style={{ height:6, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${progress}%`, background:'var(--gold)', borderRadius:99, transition:'width .3s' }} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => navigate('/team')}>Cancel</button>
              <button
                className="btn btn-gold btn-lg"
                onClick={handleUpload}
                disabled={uploading || !eventId || files.length === 0}
              >
                {uploading ? `Uploading ${progress}%…` : `Upload ${files.length > 0 ? files.length + ' ' : ''}Photo${files.length !== 1 ? 's' : ''}`}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
