import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import Spinner from './components/Spinner';

// Auth
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin
import AdminDashboard      from './pages/admin/AdminDashboard';
import EventsPage          from './pages/admin/EventsPage';
import CreateEventPage     from './pages/admin/CreateEventPage';
import EventDetailPage     from './pages/admin/EventDetailPage';
import PhotoManagementPage from './pages/admin/PhotoManagementPage';
import GallerySelectPage   from './pages/admin/GallerySelectPage';
import PublishGalleryPage  from './pages/admin/PublishGalleryPage';
import GalleryManagementPage from './pages/admin/GalleryManagementPage';
import TeamMgmtPage        from './pages/admin/TeamMgmtPage';
import SettingsPage        from './pages/admin/SettingsPage';

// Team
import TeamDashboard  from './pages/team/TeamDashboard';
import TeamEventPage  from './pages/team/TeamEventPage';
import TeamEventsPage from './pages/team/TeamEventsPage';
import TeamPhotosPage from './pages/team/TeamPhotosPage';
import TeamUploadPage from './pages/team/TeamUploadPage';
import TeamProfilePage from './pages/team/TeamProfilePage';

// Customer (public)
import GalleryPage from './pages/GalleryPage';

// OAuth callback
import AuthCallbackPage from './pages/AuthCallbackPage';

// Not found
import NotFoundPage from './pages/NotFoundPage';

/* ── Protected route wrapper ─────────────────────── */
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/team'} replace />;
  }
  return children;
}

/* ── Root redirect ────────────────────────────────── */
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/team'} replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* ── Public ──────────────────────────────── */}
        <Route path="/"               element={<RootRedirect />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/gallery/:slug"  element={<GalleryPage />} />
        <Route path="/auth/callback"  element={<AuthCallbackPage />} />

        {/* ── Admin ───────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        }/>
        <Route path="/admin/events" element={
          <ProtectedRoute role="admin"><EventsPage /></ProtectedRoute>
        }/>
        <Route path="/admin/events/new" element={
          <ProtectedRoute role="admin"><CreateEventPage /></ProtectedRoute>
        }/>
        <Route path="/admin/events/:id" element={
          <ProtectedRoute role="admin"><EventDetailPage /></ProtectedRoute>
        }/>
        <Route path="/admin/events/:id/photos" element={
          <ProtectedRoute role="admin"><PhotoManagementPage /></ProtectedRoute>
        }/>
        <Route path="/admin/events/:id/select" element={
          <ProtectedRoute role="admin"><GallerySelectPage /></ProtectedRoute>
        }/>
        <Route path="/admin/events/:id/publish" element={
          <ProtectedRoute role="admin"><PublishGalleryPage /></ProtectedRoute>
        }/>
        <Route path="/admin/galleries" element={
          <ProtectedRoute role="admin"><GalleryManagementPage /></ProtectedRoute>
        }/>
        <Route path="/admin/team" element={
          <ProtectedRoute role="admin"><TeamMgmtPage /></ProtectedRoute>
        }/>
        <Route path="/admin/settings" element={
          <ProtectedRoute role="admin"><SettingsPage /></ProtectedRoute>
        }/>

        {/* ── Team ────────────────────────────────── */}
        <Route path="/team" element={
          <ProtectedRoute role="team_member"><TeamDashboard /></ProtectedRoute>
        }/>
        <Route path="/team/events" element={
          <ProtectedRoute role="team_member"><TeamEventsPage /></ProtectedRoute>
        }/>
        <Route path="/team/events/:id" element={
          <ProtectedRoute role="team_member"><TeamEventPage /></ProtectedRoute>
        }/>
        <Route path="/team/photos" element={
          <ProtectedRoute role="team_member"><TeamPhotosPage /></ProtectedRoute>
        }/>
        <Route path="/team/upload" element={
          <ProtectedRoute role="team_member"><TeamUploadPage /></ProtectedRoute>
        }/>
        <Route path="/team/profile" element={
          <ProtectedRoute role="team_member"><TeamProfilePage /></ProtectedRoute>
        }/>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </>
  );
}
