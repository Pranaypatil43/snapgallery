/**
 * AUTH CALLBACK PAGE — /auth/callback
 *
 * The backend redirects here after successful Google OAuth with:
 *   ?token=<jwt>&user=<json-encoded-user-object>
 *
 * This page reads those params, stores them, and navigates to the dashboard.
 * If anything is wrong it shows an error and links back to /login.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { login }      = useAuth();
  const navigate       = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token  = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const oauthError = searchParams.get('error');

    if (oauthError === 'no_account') {
      setError('No account found for this Google profile. Team members must be added by an Admin — contact your Admin to get access.');
      return;
    }
    if (oauthError || !token || !userRaw) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      login(token, user);
      navigate(user.role === 'admin' ? '/admin' : '/team', { replace: true });
    } catch {
      setError('Something went wrong processing your sign-in. Please try again.');
    }
  }, []); // run once on mount

  if (error) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--off-white)' }}>
        <div style={{ textAlign:'center', maxWidth:380, padding:'0 24px' }}>
          <div style={{ fontSize:52, marginBottom:16 }}>⚠️</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Sign-in failed</h2>
          <p style={{ fontSize:14, color:'var(--text-mid)', marginBottom:24 }}>{error}</p>
          <a href="/login" className="btn btn-primary">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'var(--off-white)', gap:16 }}>
      <Spinner size="lg" />
      <p style={{ fontSize:14, color:'var(--text-soft)' }}>Signing you in with Google…</p>
    </div>
  );
}
