import api from './api';

export const listLeaves = (params) => api.get('/leaves', { params });
export const createLeave = (payload) => api.post('/leaves', payload);
export const decideLeave = (id, payload) => api.patch(`/leaves/${id}/decide`, payload);
export const cancelLeave = (id) => api.patch(`/leaves/${id}/cancel`);
