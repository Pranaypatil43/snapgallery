/**
 * TEAM PROFILE PAGE — view name, email, role; change password
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * PROFILE AVATAR:
 *   Replace the initials div with:
 *   <img src={user.profileImageUrl} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/Toast';
import { TeamSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import api from '../../api/axios';

export default function TeamProfilePage() {
  const { user } = useAuth();
  const [pwForm,   setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwErr,    setPwErr]    = useState({});
  const [saving,   setSaving]   = useState(false);

  const setField = (k, v) => {
    setPwForm(p => ({ ...p, [k]: v }));
    setPwErr(e => ({ ...e, [k]: '' }));
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.current)              errs.current = 'Enter your current password';
    if (!pwForm.newPw)                errs.newPw   = 'Enter a new password';
    else if (pwForm.newPw.length < 6) errs.newPw   = 'At least 6 characters';
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErr(errs); return; }
    setSaving(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success('Password updated successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      toast.error(msg);
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
        setPwErr({ current: 'Incorrect current password' });
      }
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TM';

  return (
    <div className="app-shell">
      <TeamSidebar />
      <div className="main-content">
        <Topbar title="My Profile" subtitle="Your account details" />
        <div className="page-body">
          <div style={{ maxWidth:600, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>

            {/* Profile card */}
            <div className="card" style={{ padding:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:28 }}>
                {/* ── IMAGE SLOT: profile avatar ── */}
                <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,var(--navy),#2d4a8a)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:24, fontWeight:800, flexShrink:0 }}>
                  {initials}
                </div>
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>{user?.name}</h2>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                    <span className="badge badge-navy">Team Member</span>
                    <span style={{ fontSize:13, color:'var(--text-soft)' }}>{user?.email}</span>
                  </div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[
                  ['Full Name',   user?.name  || '—'],
                  ['Email',       user?.email || '—'],
                  ['Role',        'Team Member'],
                  ['Member ID',   user?.id?.slice(-8).toUpperCase() || '—'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-soft)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{l}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change password */}
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Change Password</h3>
              <p style={{ fontSize:13, color:'var(--text-soft)', marginBottom:20 }}>
                Use a strong password of at least 6 characters.
              </p>
              <form onSubmit={handleChangePw} noValidate>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Current Password</label>
                    <input
                      className={`input${pwErr.current ? ' input-error' : ''}`}
                      style={{ width:'100%' }}
                      type="password"
                      placeholder="Enter current password"
                      value={pwForm.current}
                      onChange={e => setField('current', e.target.value)}
                    />
                    {pwErr.current && <div className="input-error-msg">{pwErr.current}</div>}
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>New Password</label>
                    <input
                      className={`input${pwErr.newPw ? ' input-error' : ''}`}
                      style={{ width:'100%' }}
                      type="password"
                      placeholder="Min. 6 characters"
                      value={pwForm.newPw}
                      onChange={e => setField('newPw', e.target.value)}
                    />
                    {pwErr.newPw && <div className="input-error-msg">{pwErr.newPw}</div>}
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Confirm New Password</label>
                    <input
                      className={`input${pwErr.confirm ? ' input-error' : ''}`}
                      style={{ width:'100%' }}
                      type="password"
                      placeholder="Repeat new password"
                      value={pwForm.confirm}
                      onChange={e => setField('confirm', e.target.value)}
                    />
                    {pwErr.confirm && <div className="input-error-msg">{pwErr.confirm}</div>}
                  </div>

                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
