/**
 * SETTINGS PAGE (Admin)
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * PROFILE PHOTO:
 *   Replace the avatar initials div with:
 *     <img src={user.profileImageUrl} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
 *   Add a "Change Photo" button that opens a file input.
 * ─────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { toast } from '../../components/Toast';

const sections = ['Profile', 'Account', 'Security', 'Notifications'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [active, setActive] = useState('Profile');
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [notifs, setNotifs] = useState({ email: true, gallery: true, upload: false });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwords.newPw !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    if (passwords.newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    toast.success('Password changed successfully');
    setPasswords({ current: '', newPw: '', confirm: '' });
  };

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Topbar title="Settings" subtitle="Manage your account and preferences" />
        <div className="page-body">
          <div style={{ display: 'flex', gap: 28, maxWidth: 900 }}>
            {/* Settings nav */}
            <div className="settings-nav">
              {sections.map(s => (
                <div key={s} className={`settings-nav-item ${active === s ? 'active' : ''}`} onClick={() => setActive(s)}>{s}</div>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              {active === 'Profile' && (
                <div className="card" style={{ padding: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Profile Information</h3>
                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    {/* ── IMAGE SLOT: profile photo ── */}
                    <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-light))', color: 'var(--navy)', fontSize: 26 }}>
                      {profile.name[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700 }}>{profile.name}</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 8 }}>Admin / Lead</p>
                      <button className="btn btn-outline btn-sm">Change Photo</button>
                    </div>
                  </div>
                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email Address</label>
                      <input className="input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                  </form>
                </div>
              )}

              {active === 'Security' && (
                <div className="card" style={{ padding: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Change Password</h3>
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[['Current Password','current','current-password'],['New Password','newPw','new-password'],['Confirm New Password','confirm','new-password']].map(([l,k,ac]) => (
                      <div key={k} className="input-group">
                        <label className="input-label">{l}</label>
                        <input type="password" className="input" value={passwords[k]} onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))} autoComplete={ac} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary">Update Password</button>
                    </div>
                  </form>
                </div>
              )}

              {active === 'Notifications' && (
                <div className="card" style={{ padding: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Notification Preferences</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[['email','Email Notifications','Receive email alerts for new activity'],
                      ['gallery','Gallery Notifications','Get notified when a gallery is viewed'],
                      ['upload','Upload Notifications','Get notified when team members upload photos']
                    ].map(([k,l,d]) => (
                      <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600 }}>{l}</div>
                          <div style={{ fontSize:12, color:'var(--text-soft)', marginTop:2 }}>{d}</div>
                        </div>
                        <button
                          onClick={() => setNotifs(p => ({ ...p, [k]: !p[k] }))}
                          style={{ width:46, height:26, borderRadius:13, background: notifs[k] ? 'var(--navy)' : 'var(--border)', border:'none', cursor:'pointer', position:'relative', transition:'background .2s' }}>
                          <span style={{ position:'absolute', top:3, left: notifs[k] ? 23 : 3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:20 }}>
                    <button className="btn btn-primary" onClick={() => toast.success('Preferences saved')}>Save Preferences</button>
                  </div>
                </div>
              )}

              {active === 'Account' && (
                <div className="card" style={{ padding: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Account Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[['Account ID', user?._id || '—'],['Role','Admin / Lead'],['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—']].map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                        <span style={{ color:'var(--text-soft)', fontWeight:500 }}>{k}</span>
                        <span style={{ fontWeight:600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
