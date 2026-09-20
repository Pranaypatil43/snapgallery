/**
 * TEAM MANAGEMENT PAGE (Admin)
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * MEMBER AVATARS:
 *   If members have a profileImageUrl field, set it on the avatar div:
 *     style={{ backgroundImage: `url(${m.profileImageUrl})`, backgroundSize:'cover' }}
 *   Then remove the text content.
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { getTeamMembers, getEvents, addMembers } from '../../api/events';
import { inviteTeamMember } from '../../api/auth';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const AVATAR_COLORS = ['#7c3aed','#059669','#dc2626','#0369a1','#d97706','#9333ea'];
const EMPTY_FORM    = { name: '', email: '', password: '' };

export default function TeamMgmtPage() {
  const [members,        setMembers]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');

  // ── Invite modal state ──
  const [showInvite,     setShowInvite]     = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [formErr,        setFormErr]        = useState({});
  const [submitting,     setSubmitting]     = useState(false);

  // ── Assign Event modal state ──
  const [assignTarget,   setAssignTarget]   = useState(null); // member object
  const [events,         setEvents]         = useState([]);
  const [eventsLoading,  setEventsLoading]  = useState(false);
  const [selectedEvent,  setSelectedEvent]  = useState('');
  const [assigning,      setAssigning]      = useState(false);

  /* ── fetch members ── */
  const fetchMembers = useCallback(async () => {
    try { const r = await getTeamMembers(); setMembers(r.data.members); }
    catch { toast.error('Failed to load team members'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  /* ── open assign-event modal ── */
  const openAssignModal = async (member) => {
    setAssignTarget(member);
    setSelectedEvent('');
    setEventsLoading(true);
    try {
      const r = await getEvents();
      setEvents(r.data.events || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedEvent) return;
    setAssigning(true);
    try {
      await addMembers(selectedEvent, [assignTarget._id]);
      toast.success(`${assignTarget.name} assigned to event`);
      setAssignTarget(null);
      fetchMembers(); // refresh upload/event counts
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign member';
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  /* ── filtered table ── */
  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  /* ── invite form helpers ── */
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFormErr(fe => ({ ...fe, [e.target.name]: '' }));
  };

  const validateInvite = () => {
    const errs = {};
    if (!form.name.trim())                       errs.name     = 'Name is required';
    if (!form.email.trim())                      errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))  errs.email    = 'Enter a valid email';
    if (!form.password)                          errs.password = 'Password is required';
    else if (form.password.length < 6)           errs.password = 'At least 6 characters';
    return errs;
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    const errs = validateInvite();
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setSubmitting(true);
    try {
      const res = await inviteTeamMember(form);
      const newMember = res.data.member;
      const formatted = {
        ...newMember,
        _id: newMember._id || newMember.id,
        eventCount: 0,
        uploadCount: 0,
      };
      setMembers(prev => [formatted, ...prev]);
      toast.success(`${newMember.name} added as team member`);
      setShowInvite(false);
      setForm(EMPTY_FORM);
      setFormErr({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add member';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setFormErr({ email: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const closeInvite = () => {
    if (submitting) return;
    setShowInvite(false);
    setForm(EMPTY_FORM);
    setFormErr({});
  };

  /* ── topbar ── */
  const topbarActions = (
    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
      <div className="search-wrap">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="search-input"
          placeholder="Search members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ width:15, height:15, marginRight:6 }}>
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Member
      </button>
    </div>
  );

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Topbar
          title="Team Members"
          subtitle={`${members.length} registered team members`}
          actions={topbarActions}
        />
        <div className="page-body">

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
            {[
              ['Total Members',  members.length,                                         'var(--navy-50)',  '#0369a1'],
              ['Active',         members.filter(m => m.role === 'team_member').length,   'var(--green-bg)', '#16a34a'],
              ['Total Uploads',  members.reduce((s, m) => s + (m.uploadCount || 0), 0), 'var(--gold-pale)','#92650a'],
            ].map(([l, v, , col]) => (
              <div key={l} className="stat-card" style={{ '--col': col }}>
                <div className="stat-value" style={{ color: col }}>{v}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          {loading ? <PageSpinner /> : filtered.length === 0 ? (
            <EmptyState
              icon="👥"
              title={search ? 'No members found' : 'No team members yet'}
              description={search ? 'Try a different search term.' : 'Click "Add Member" to create your first team member.'}
              action={!search && (
                <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                  Add Member
                </button>
              )}
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Assigned Events</th>
                    <th>Photos Uploaded</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m._id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          {/* ── IMAGE SLOT: member avatar ── */}
                          <div
                            className="avatar avatar-md"
                            style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], color:'#fff', flexShrink:0 }}
                          >
                            {m.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div>
                            <div style={{ fontSize:12, color:'var(--text-soft)' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-navy">{m.eventCount || 0} events</span></td>
                      <td><span style={{ fontWeight:700, color:'var(--navy)', fontSize:15 }}>{m.uploadCount || 0}</span></td>
                      <td style={{ color:'var(--text-soft)', fontSize:13 }}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td><span className="badge badge-green">● Active</span></td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openAssignModal(m)}
                          >
                            Assign Event
                          </button>
                          <button className="btn btn-ghost btn-sm">View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      <Modal open={showInvite} onClose={closeInvite} title="Add Team Member" size="md">
        <form onSubmit={handleInviteSubmit} noValidate>
          <p style={{ fontSize:13, color:'var(--text-soft)', marginBottom:20, marginTop:-4 }}>
            Create a login for your team member. They can sign in immediately with these credentials.
          </p>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
              Full Name
            </label>
            <input
              className={`input${formErr.name ? ' input-error' : ''}`}
              style={{ width:'100%' }}
              name="name"
              type="text"
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={handleChange}
              autoFocus
            />
            {formErr.name && <div className="input-error-msg">{formErr.name}</div>}
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
              Email Address
            </label>
            <input
              className={`input${formErr.email ? ' input-error' : ''}`}
              style={{ width:'100%' }}
              name="email"
              type="email"
              placeholder="priya@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {formErr.email && <div className="input-error-msg">{formErr.email}</div>}
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
              Temporary Password
            </label>
            <input
              className={`input${formErr.password ? ' input-error' : ''}`}
              style={{ width:'100%' }}
              name="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
            />
            {formErr.password && <div className="input-error-msg">{formErr.password}</div>}
            <div className="input-hint">Share this password with your team member so they can log in.</div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24 }}>
            <button type="button" className="btn btn-ghost" onClick={closeInvite} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Event Modal ── */}
      <Modal
        open={!!assignTarget}
        onClose={() => !assigning && setAssignTarget(null)}
        title={`Assign Event — ${assignTarget?.name || ''}`}
        size="sm"
      >
        <p style={{ fontSize:13, color:'var(--text-soft)', marginBottom:16, marginTop:-4 }}>
          Choose an event to assign this member to. They will immediately be able to upload photos for it.
        </p>

        {eventsLoading ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-soft)', fontSize:13 }}>
            Loading events…
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-soft)', fontSize:13 }}>
            No events found. Create an event first.
          </div>
        ) : (
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
              Event
            </label>
            <select
              className="input"
              style={{ width:'100%' }}
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
            >
              <option value="">— Select an event —</option>
              {events.map(ev => (
                <option key={ev._id} value={ev._id}>
                  {ev.name}{ev.date ? ` · ${new Date(ev.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setAssignTarget(null)}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAssign}
            disabled={!selectedEvent || assigning || eventsLoading}
          >
            {assigning ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
