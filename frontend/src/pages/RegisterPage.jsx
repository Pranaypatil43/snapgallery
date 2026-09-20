/**
 * REGISTER PAGE
 *
 * ── IMAGE SLOTS ──────────────────────────────────────────────
 * 1. LOGO ICON (top of card):
 *    Replace the SVG camera icon with:
 *      <img src="/images/logo.png" alt="SnapGallery" style={{width:28,height:28}} />
 * ─────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPw, setShowPw]  = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); setApiError(''); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name    = 'Full name is required';
    if (!form.email)        e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)     e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await registerApi({ name: form.name, email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/team');
    } catch (err) {
      const apiErrs = err.response?.data?.errors;
      setApiError(apiErrs?.length ? apiErrs.map(e => e.msg).join(', ') : err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,var(--navy),var(--navy-light))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* ── IMAGE SLOT 1: logo icon ── */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
                <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)' }}>SnapGallery</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Create your account</h1>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 6 }}>
            The first registered user becomes <strong>Admin</strong>
          </p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            {/* Name */}
            <div className="input-group">
              <label className="input-label" htmlFor="name">Full Name <span>*</span></label>
              <div className="input-icon-wrap">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input id="name" type="text" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Arjun Mehta" value={form.name} onChange={e => set('name', e.target.value)} autoComplete="name"/>
              </div>
              {errors.name && <span className="input-error-msg">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="input-group">
              <label className="input-label" htmlFor="reg-email">Email address <span>*</span></label>
              <div className="input-icon-wrap">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                <input id="reg-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@studio.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email"/>
              </div>
              {errors.email && <span className="input-error-msg">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label" htmlFor="reg-password">Password <span>*</span></label>
              <div className="input-icon-wrap">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input id="reg-password" type={showPw ? 'text' : 'password'} className={`input ${errors.password ? 'input-error' : ''}`} placeholder="Minimum 6 characters" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password"/>
                <button type="button" className="input-icon-right" onClick={() => setShowPw(p=>!p)} style={{border:'none',background:'none'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              {errors.password && <span className="input-error-msg">{errors.password}</span>}
            </div>

            {/* Confirm password */}
            <div className="input-group">
              <label className="input-label" htmlFor="confirm">Confirm Password <span>*</span></label>
              <div className="input-icon-wrap">
                <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input id="confirm" type="password" className={`input ${errors.confirm ? 'input-error' : ''}`} placeholder="Repeat password" value={form.confirm} onChange={e => set('confirm', e.target.value)} autoComplete="new-password"/>
              </div>
              {errors.confirm && <span className="input-error-msg">{errors.confirm}</span>}
            </div>

            {/* Role info */}
            <div style={{ padding: '11px 14px', background: 'var(--off-white)', borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--navy)' }}>First registered user</strong> → automatically assigned as <strong style={{ color: 'var(--navy)' }}>Admin</strong><br/>
              <strong>Subsequent users</strong> → assigned as Team Member
            </div>

            {apiError && (
              <div style={{ padding: '11px 14px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--red)' }}>
                {apiError}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <Spinner size="sm" white /> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-mid)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
