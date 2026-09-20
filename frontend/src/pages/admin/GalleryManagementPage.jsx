/**
 * GALLERY MANAGEMENT PAGE (Admin)
 * No image slots on this page — it's a list/table view.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminGalleries, publishGallery, unpublishGallery } from '../../api/galleries';
import { toast } from '../../components/Toast';
import { AdminSidebar } from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import { PageSpinner } from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';

export default function GalleryManagementPage() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    try { const r = await getAdminGalleries(); setGalleries(r.data.galleries); }
    catch { toast.error('Failed to load galleries'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handlePublish = async (g) => {
    try {
      if (g.isPublished) { await unpublishGallery(g._id); toast.success('Gallery unpublished'); }
      else               { await publishGallery(g._id);   toast.success('Gallery published!'); }
      fetch();
    } catch { toast.error('Action failed'); }
  };

  const copyLink = (slug) => {
    navigator.clipboard?.writeText(`${window.location.origin}/gallery/${slug}`);
    toast.success('Link copied!');
  };

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Topbar title="Galleries" subtitle={`${galleries.length} total galleries`} />
        <div className="page-body">
          {loading ? <PageSpinner /> : galleries.length === 0 ? (
            <EmptyState icon="🖼" title="No galleries yet"
              description="Publish your first gallery from an event's photos."
              action={<button className="btn btn-primary" onClick={() => navigate('/admin/events')}>Go to Events</button>} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Gallery</th>
                    <th>Event</th>
                    <th>Photos</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {galleries.map(g => (
                    <tr key={g._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{g.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 2 }}>/gallery/{g.slug}</div>
                      </td>
                      <td style={{ color: 'var(--text-mid)', fontSize: 13 }}>{g.eventId?.name || '—'}</td>
                      <td>
                        <span className="badge badge-navy">{g.selectedPhotos?.length || 0} photos</span>
                      </td>
                      <td>
                        <span className={`badge ${g.isPublished ? 'badge-green' : 'badge-gray'}`}>
                          ● {g.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-soft)', fontSize: 13 }}>
                        {new Date(g.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                      </td>
                      <td style={{ color: 'var(--text-soft)', fontSize: 13 }}>
                        {g.publishedAt ? new Date(g.publishedAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/events/${g.eventId?._id}`)}>View</button>
                          <button className={`btn btn-sm ${g.isPublished ? 'btn-danger' : 'btn-success'}`} onClick={() => handlePublish(g)}>
                            {g.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          {g.isPublished && (
                            <button className="btn btn-outline btn-sm" onClick={() => copyLink(g.slug)}>Copy Link</button>
                          )}
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
    </div>
  );
}
