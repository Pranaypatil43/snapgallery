import api from './axios';

export const createGallery = (data) => api.post('/galleries', data);
export const publishGallery = (id) => api.patch(`/galleries/${id}/publish`);
export const unpublishGallery = (id) => api.patch(`/galleries/${id}/unpublish`);
export const getAdminGalleries = () => api.get('/galleries/admin');
export const getGalleryByEvent = (eventId) => api.get(`/galleries/event/${eventId}`);

// Public (no auth)
export const getPublicGalleryInfo = (slug) => api.get(`/galleries/public/${slug}`);
export const verifyGalleryPin = (slug, pin) =>
  api.post(`/galleries/public/${slug}/verify`, { pin });
export const accessGalleryByPin = (pin) =>
  api.post('/galleries/public/access', { pin });
