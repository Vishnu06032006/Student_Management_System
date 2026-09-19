import api from './api';

export const bulkPromote = (payload) => api.post('/promotions/bulk', payload);
