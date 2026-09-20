/**
 * CREATE EVENT PAGE
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * COVER IMAGE PREVIEW:
 *   When user selects a cover image file, show preview with:
 *     URL.createObjectURL(selectedFile)
 *   In the cover upload box, replace the placeholder div with:
 *     <img src={previewUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, getTeamMembers } from '../../api/events';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import Spinner from '../../components/Spinner';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ name: '', date: '', location: '', description: '' });
  const [errors, setErrors]     = useState({});
  const [members, setMembers]   = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    getTeamMembers().then(r => setMembers(r.data.members)).catch(() => {});
  }, []);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Event name is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const toggleMember = (id) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await createEvent({ ...form, memberIds: selected });
      toast.success('Event created successfully!');
      navigate(`/admin/events/${res.data.event._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally { setLoading(false); }
  };

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Topbar title="Create New Event" subtitle="Set up your event and invite team" />
        <div className="page-body">
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <button className="back-btn" onClick={() => navigate('/admin/events')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Events
            </button>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
                {/* Left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Event Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="input-group">
                        <label className="input-label">Event Name <span style={{color:'var(--red)'}}>*</span></label>
                        <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Arjun & Priya Wedding" value={form.name} onChange={e => set('name', e.target.value)} />
                        {errors.name && <span className="input-error-msg">{errors.name}</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="input-group">
                          <label className="input-label">Event Date</label>
                          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Location</label>
                          <input className="input" placeholder="Mumbai, Maharashtra" value={form.location} onChange={e => set('location', e.target.value)} />
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea className="input" rows={3} placeholder="Optional event description…" value={form.description} onChange={e => set('description', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Cover image */}
                  <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Cover Image</h3>
                    <label style={{ cursor: 'pointer' }}>
                      {coverPreview ? (
                        /* ── IMAGE SLOT: preview of selected cover image ── */
                        <div style={{ height: 200, borderRadius: 'var(--r-md)', overflow: 'hidden', position: 'relative' }}>
                          <img src={coverPreview} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
                            <span className="badge badge-navy" style={{ fontSize: 11 }}>Change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-zone" style={{ padding: '36px 24px' }}>
                          <div className="upload-zone-icon" style={{ width: 48, height: 48 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" strokeWidth="2"><path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="13" r="3"/></svg>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Upload cover photo</div>
                          <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>JPG or PNG, max 10 MB</div>
                        </div>
                      )}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
                    </label>
                  </div>
                </div>

                {/* Right: team members */}
                <div className="card" style={{ padding: 20, height: 'fit-content', position: 'sticky', top: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Add Team Members</h3>
                  {members.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>No team members registered yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {members.map(m => {
                        const isSelected = selected.includes(m._id);
                        return (
                          <div key={m._id}
                            onClick={() => toggleMember(m._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r)', border: `1.5px solid ${isSelected ? 'var(--navy)' : 'var(--border)'}`, background: isSelected ? 'var(--navy-50)' : '#fff', cursor: 'pointer', transition: 'all .15s' }}>
                            {/* ── IMAGE SLOT: member avatar backgroundImage ── */}
                            <div className="avatar avatar-sm" style={{ background: isSelected ? 'var(--navy)' : 'var(--surface)', color: isSelected ? '#fff' : 'var(--text-mid)' }}>
                              {m.name[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                            </div>
                            {isSelected && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {selected.length > 0 && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--gold-pale)', borderRadius: 'var(--r)', border: '1px solid var(--gold-border)', fontSize: 12, color: '#92650a', fontWeight: 600 }}>
                      {selected.length} member{selected.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              </div>

              {/* Footer actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/events')}>Cancel</button>
                <button type="submit" className="btn btn-gold btn-lg" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : '✓ Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
