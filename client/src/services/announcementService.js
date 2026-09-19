import api from './api';

export const listAnnouncements = () => api.get('/announcements');
export const createAnnouncement = (payload) => api.post('/announcements', payload);
