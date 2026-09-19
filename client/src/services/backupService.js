import api from './api';

export const listBackups = () => api.get('/backups');
export const createBackup = () => api.post('/backups');
