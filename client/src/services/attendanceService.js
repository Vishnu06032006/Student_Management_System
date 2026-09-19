import api from './api';

export const getRoster = (params) => api.get('/attendance/roster', { params });
export const markAttendance = (payload) => api.post('/attendance/mark', payload);
export const getShortage = (params) => api.get('/attendance/shortage', { params });
export const getStudentSummary = (studentId, params) => api.get(`/attendance/student/${studentId}/summary`, { params });
export const getStudentDaily = (studentId, params) => api.get(`/attendance/student/${studentId}/daily`, { params });
