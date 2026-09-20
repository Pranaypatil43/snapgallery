import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin' : user ? '/team' : '/login';

  return (
    <div style={{ minHeight:'100vh', background:'var(--off-white)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:96, fontWeight:900, color:'var(--border)', lineHeight:1 }}>404</div>
        <h1 style={{ fontSize:26, fontWeight:800, color:'var(--text)', marginTop:8 }}>Page not found</h1>
        <p style={{ fontSize:15, color:'var(--text-mid)', marginTop:8, marginBottom:28 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to={home} className="btn btn-primary">
          ← Go home
        </Link>
      </div>
    </div>
  );
}
