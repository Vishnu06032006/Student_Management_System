import api from './api';

export const UPLOADS_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const computeClasses = (params) => api.get('/od-requests/compute-classes', { params });
export const createODRequest = (formData) =>
  api.post('/od-requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const listMyODRequests = () => api.get('/od-requests/me');
export const listStaffODQueue = () => api.get('/od-requests/staff');
export const decideODItem = (requestId, itemId, payload) => api.patch(`/od-requests/${requestId}/items/${itemId}/decide`, payload);
