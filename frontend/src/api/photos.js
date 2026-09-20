import api from './axios';

export const uploadPhotos = (eventId, formData, onProgress) =>
  api.post(`/photos/${eventId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });

export const getEventPhotos = (eventId) => api.get(`/photos/event/${eventId}`);
export const deletePhoto = (photoId) => api.delete(`/photos/${photoId}`);
