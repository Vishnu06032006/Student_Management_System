import api from './api';

export function listStaff(params) {
  return api.get('/staff', { params });
}

export function getStaff(id) {
  return api.get(`/staff/${id}`);
}

export function createStaff(payload) {
  return api.post('/staff', payload);
}

export function updateStaff(id, payload) {
  return api.put(`/staff/${id}`, payload);
}

export function setStaffStatus(id, status) {
  return api.patch(`/staff/${id}/status`, { status });
}

export function resetStaffPassword(id) {
  return api.post(`/staff/${id}/reset-password`);
}

export function getStaffWorkload(id) {
  return api.get(`/staff/${id}/workload`);
}
