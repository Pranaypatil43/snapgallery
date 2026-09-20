import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { accessGalleryByPin } from '../api/galleries';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}/api/auth/google`;

/* ── Google Logo ── */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

/* ── Scrolling image strip row ── */
const IMGS = [1,2,3,4,5,6,7,8,9,10,11];

function ScrollRow({ reverse = false, top, offset = 0 }) {
  // Shift the starting image and duplicate for seamless loop
  const shifted = [...IMGS.slice(offset), ...IMGS.slice(0, offset)];
  const strip   = [...shifted, ...shifted]; // doubled for infinite illusion

  return (
    <div style={{
      position: 'absolute',
      top,
      left: 0,
      right: 0,
      overflow: 'hidden',
      maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
      zIndex: 1,
    }}>
      <div style={{
        display: 'flex',
        gap: 12,
        width: 'max-content',
        animation: `${reverse ? 'scrollXReverse' : 'scrollX'} ${reverse ? '42s' : '32s'} linear infinite`,
      }}>
        {strip.map((n, i) => (
          <div key={i} style={{
            width: 150,
            height: 96,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,.07)',
            boxShadow: '0 4px 20px rgba(0,0,0,.5)',
          }}>
            <img
              src={`/cameras/cam${n}.jpg`}
              alt=""
              draggable={false}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();

  const [role,       setRole]       = useState('admin');
  const [form,       setForm]       = useState({ email: '', password: '' });
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [apiError,   setApiError]   = useState(() => {
    const e = searchParams.get('error');
    if (e === 'no_account')    return 'No Admin account linked to that Google profile.';
    if (e === 'google_failed') return 'Google sign-in failed. Please try again.';
    return '';
  });
  const [pin,        setPin]        = useState('');
  const [pinError,   setPinError]   = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const set = (k, v) => {
    setForm(p => ({...p, [k]: v}));
    setErrors(p => ({...p, [k]: ''}));
    setApiError('');
  };

  const switchRole = (r) => {
    setRole(r);
    setErrors({});
    setApiError('');
    setPin('');
    setPinError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res  = await loginApi(form);
      const user = res.data.user;
      if (role === 'admin' && user.role !== 'admin') {
        setApiError('This is a Team Member account. Switch to the Team Member tab.');
        setLoading(false); return;
      }
      if (role === 'team' && user.role !== 'team_member') {
        setApiError('This is an Admin account. Switch to the Admin tab.');
        setLoading(false); return;
      }
      login(res.data.token, user);
      navigate(user.role === 'admin' ? '/admin' : '/team');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handlePinAccess = async (e) => {
    e.preventDefault();
    if (!pin.trim()) { setPinError('Enter your gallery PIN'); return; }
    setPinLoading(true);
    try {
      const res = await accessGalleryByPin(pin.trim());
      navigate(`/gallery/${res.data.gallery.slug}`, {
        state: { verified: true, gallery: res.data.gallery },
      });
    } catch (err) {
      setPinError(err.response?.data?.message || 'Incorrect PIN. Try again.');
      setPin('');
    } finally { setPinLoading(false); }
  };

  const TABS = [
    { key: 'admin',    img: '/icons/admin.jpg',    label: 'Admin',       sub: 'Studio lead' },
    { key: 'team',     img: '/icons/camara.png',   label: 'Team Member', sub: 'Photographer' },
    { key: 'customer', img: '/icons/customer.jpg', label: 'Customer',    sub: 'View gallery' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter',sans-serif" }}>

      {/* ══════════════════ LEFT PANEL ══════════════════ */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #080b14 0%, #0e1220 40%, #141926 100%)',
      }}>

        {/* Animated mesh gradient orbs */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'15%', left:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,77,109,.18) 0%, transparent 65%)', animation:'orb 8s ease-in-out infinite' }}/>
          <div style={{ position:'absolute', bottom:'10%', right:'15%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,.15) 0%, transparent 65%)', animation:'orb 11s ease-in-out infinite reverse' }}/>
          <div style={{ position:'absolute', top:'55%', left:'55%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,161,.1) 0%, transparent 65%)', animation:'orb 14s ease-in-out infinite' }}/>
        </div>

        {/* Subtle grid overlay */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>

        {/* Logo top-left */}
        <div style={{ position:'absolute', top:36, left:44, display:'flex', alignItems:'center', gap:12, zIndex:5 }}>
          <div style={{ width:42, height:42, borderRadius:13, background:'linear-gradient(135deg,#ff4d6d,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(255,77,109,.4)', animation:'glowPulse 3s ease-in-out infinite' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-.01em' }}>SnapGallery</div>
            <div style={{ fontSize:10, color:'rgba(255,77,109,.8)', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase' }}>Photo Platform</div>
          </div>
        </div>

        {/* ── 3 scrolling image rows ── */}
        <ScrollRow reverse={false} top="18%"  offset={0}  />
        <ScrollRow reverse={true}  top="40%"  offset={4}  />
        <ScrollRow reverse={false} top="62%"  offset={8}  />

        {/* Dark overlay — keeps text readable over images */}
        <div style={{ position:'absolute', inset:0, zIndex:2, background:'linear-gradient(160deg, rgba(8,11,20,.82) 0%, rgba(8,11,20,.45) 50%, rgba(8,11,20,.86) 100%)', pointerEvents:'none' }}/>

        {/* Hero headline — bottom-left */}
        <div style={{ position:'absolute', bottom:52, left:44, right:44, zIndex:5, animation: mounted ? 'fadeInUp .8s ease' : 'none' }}>
          <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:44, fontWeight:800, color:'#fff', lineHeight:1.08, letterSpacing:'-.02em' }}>
            Capture.<br/>
            <span style={{
              background:'linear-gradient(90deg,#ff4d6d,#8b5cf6,#00d4a1)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              backgroundSize:'200%',
              animation:'gradientShift 4s ease infinite',
            }}>
              Curate.
            </span><br/>
            Deliver.
          </h1>
        </div>
      </div>

      {/* ══════════════════ RIGHT PANEL ══════════════════ */}
      <div style={{
        width: 500, flexShrink: 0, background: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 48px', overflowY: 'auto',
        animation: mounted ? 'fadeInDown .5s ease' : 'none',
      }}>

        <div style={{ marginBottom:32 }}>
          <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:800, color:'#111827', letterSpacing:'-.02em' }}>Welcome back</h2>
          <p style={{ fontSize:14, color:'#6b7280', marginTop:4 }}>Choose your role to continue</p>
        </div>

        {/* Role tabs */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:24 }}>
          {TABS.map(({ key, img, label, sub }) => (
            <button key={key} type="button" onClick={() => switchRole(key)} style={{
              padding:'14px 8px', borderRadius:14,
              border: role===key ? '2px solid #ff4d6d' : '2px solid #e4e7f0',
              background: role===key ? 'rgba(255,77,109,.05)' : '#fff',
              cursor:'pointer', textAlign:'center',
              transition:'all .2s cubic-bezier(.4,0,.2,1)',
              transform: role===key ? 'translateY(-2px)' : 'none',
              boxShadow: role===key ? '0 4px 16px rgba(255,77,109,.15)' : 'none',
            }}>
              <div style={{ width:40, height:40, borderRadius:10, overflow:'hidden', margin:'0 auto 8px', border: role===key ? '2px solid rgba(255,77,109,.3)' : '2px solid #e4e7f0', transition:'border-color .2s' }}>
                <img src={img} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color: role===key ? '#ff4d6d' : '#111827' }}>{label}</div>
              <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* ── Customer PIN form ── */}
        {role === 'customer' && (
          <form onSubmit={handlePinAccess} style={{ display:'flex', flexDirection:'column', gap:16 }} noValidate>
            <div>
              <label style={{ display:'block', fontSize:12.5, fontWeight:600, color:'#111827', marginBottom:8 }}>
                Gallery PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                className={`input${pinError ? ' input-error' : ''}`}
                style={{ fontSize:32, letterSpacing:'.4em', textAlign:'center', padding:'18px', borderRadius:16, width:'100%', borderWidth:2, fontFamily:"'DM Serif Display',Georgia,serif" }}
                placeholder="· · · · · ·"
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g,'')); setPinError(''); }}
                maxLength={10}
                autoFocus
                autoComplete="off"
              />
              {pinError && <div style={{ fontSize:12, color:'#ef4444', marginTop:6, fontWeight:500 }}>{pinError}</div>}
              <div style={{ fontSize:11.5, color:'#9ca3af', marginTop:6 }}>Enter the PIN your photographer shared with you</div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pinLoading || !pin.trim()} style={{ borderRadius:12 }}>
              {pinLoading ? <Spinner size="sm" white /> : 'Open My Gallery →'}
            </button>
            <p style={{ textAlign:'center', fontSize:12, color:'#9ca3af' }}>
              Have the gallery link? Open it directly in your browser.
            </p>
          </form>
        )}

        {/* ── Email / password form ── */}
        {role !== 'customer' && (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }} noValidate>

            <div className="input-group">
              <label className="input-label" htmlFor="email">Email address</label>
              <div className="input-icon-wrap">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,12 2,6"/>
                </svg>
                <input
                  id="email" type="email"
                  className={`input${errors.email ? ' input-error' : ''}`}
                  placeholder="you@studio.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="input-error-msg">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className="input-icon-wrap">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className={`input${errors.password ? ' input-error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(p => !p)} style={{ border:'none', background:'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    {showPw
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && <span className="input-error-msg">{errors.password}</span>}
            </div>

            {apiError && (
              <div style={{ padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, fontSize:13, color:'#dc2626', display:'flex', gap:8, alignItems:'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {apiError}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ borderRadius:12 }}>
              {loading ? <Spinner size="sm" white /> : `Sign In as ${role === 'admin' ? 'Admin' : 'Team Member'}`}
            </button>

            {/* Google — admin only */}
            {role === 'admin' && (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:1, background:'#e4e7f0' }}/>
                  <span style={{ fontSize:11, color:'#9ca3af' }}>or</span>
                  <div style={{ flex:1, height:1, background:'#e4e7f0' }}/>
                </div>
                <a
                  href={GOOGLE_AUTH_URL}
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    padding:'11px 16px', border:'1.5px solid #e4e7f0', borderRadius:12,
                    background:'#fff', color:'#111827', fontSize:14, fontWeight:600,
                    textDecoration:'none', transition:'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#ff4d6d'; e.currentTarget.style.boxShadow='0 4px 16px rgba(255,77,109,.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e4e7f0'; e.currentTarget.style.boxShadow='none'; }}
                >
                  <GoogleLogo /> Continue with Google
                </a>
              </>
            )}
          </form>
        )}

        <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid #f0f2f8', textAlign:'center' }}>
          <p style={{ fontSize:13, color:'#6b7280' }}>
            First time?{' '}
            <Link to="/register" style={{ color:'#ff4d6d', fontWeight:600 }}>Create Admin account →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
