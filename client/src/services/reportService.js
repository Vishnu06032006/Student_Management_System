import api from './api';

export const getClassPerformance = (params) => api.get('/reports/class-performance', { params });
export const getSubjectPerformance = (params) => api.get('/reports/subject-performance', { params });
export const getNeedsAttention = () => api.get('/reports/needs-attention');
export const getDashboardSummary = () => api.get('/reports/dashboard-summary');
