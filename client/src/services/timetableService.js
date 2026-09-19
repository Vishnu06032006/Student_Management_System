import api from './api';

export const listTimetable = (params) => api.get('/timetable', { params });
export const createTimetableEntry = (payload) => api.post('/timetable', payload);
export const deleteTimetableEntry = (id) => api.delete(`/timetable/${id}`);
