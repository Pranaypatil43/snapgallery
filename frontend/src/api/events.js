import api from './axios';

export const getEvents      = () => api.get('/events');
export const getEvent       = (id) => api.get(`/events/${id}`);
export const createEvent    = (data) => api.post('/events', data);
export const uploadEventCover = (id, formData) =>
  api.post(`/events/${id}/cover`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const addMembers     = (eventId, memberIds) =>
  api.post(`/events/${eventId}/members`, { memberIds });
export const removeMember   = (eventId, memberId) =>
  api.delete(`/events/${eventId}/members/${memberId}`);
export const getTeamMembers = () => api.get('/events/users/team-members');
