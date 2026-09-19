import api from './api';

export const listActivityLogs = (params) => api.get('/activity-logs', { params });
