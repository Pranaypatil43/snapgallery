import { useState, useRef } from 'react';
import { uploadPhotos } from '../api/photos';
import { toast } from './Toast';
import Spinner from './Spinner';

export default function UploadModal({ open, eventId, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  if (!open) return null;

  const addFiles = (incoming) => {
    const images = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    if (images.length < incoming.length) toast.error('Only image files accepted');
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...images.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach(f => fd.append('photos', f));
    setUploading(true); setProgress(0);
    try {
      const res = await uploadPhotos(eventId, fd, setProgress);
      toast.success(`${res.data.count} photo${res.data.count !== 1 ? 's' : ''} uploaded successfully`);
      setFiles([]);
      onUploaded?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}>
      <div className="modal modal-md">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Upload Event Photos</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 2 }}>JPG, PNG, WebP — max 20 MB each</div>
          </div>
          {!uploading && <button className="modal-close" onClick={onClose}>×</button>}
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          {/*
            ── IMAGE SLOT ──
            The upload zone previews selected thumbnails.
            Each file in `files` array can be previewed with URL.createObjectURL(file)
          */}
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current.click()}
          >
            <div className="upload-zone-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
              Drag & drop your photos here
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', margin: '6px 0 12px' }}>or</div>
            <button className="btn btn-primary btn-sm" onClick={(e) => e.stopPropagation()}>
              Browse Files
            </button>
            <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </div>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--off-white)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                  {/* ── IMAGE SLOT: <img src={URL.createObjectURL(f)} /> for thumbnail preview ── */}
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🖼</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-soft)' }}>{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                    {uploading && (
                      <div className="progress" style={{ marginTop: 4 }}>
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                  {uploading
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>{progress}%</span>
                    : <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                  }
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div style={{ padding: '12px 16px', background: 'var(--navy-50)', borderRadius: 'var(--r)', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                <span>Uploading photos…</span>
                <span>{progress}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn btn-gold" onClick={handleUpload} disabled={!files.length || uploading}
            style={{ minWidth: 130 }}>
            {uploading ? <Spinner size="sm" white /> : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
