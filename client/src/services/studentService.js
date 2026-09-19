import api from './api';

export function listStudents(params) {
  return api.get('/students', { params });
}

export function getStudent(id) {
  return api.get(`/students/${id}`);
}

export function createStudent(payload) {
  return api.post('/students', payload);
}

export function updateStudent(id, payload) {
  return api.put(`/students/${id}`, payload);
}

export function setStudentStatus(id, status) {
  return api.patch(`/students/${id}/status`, { status });
}

export function resetStudentPassword(id) {
  return api.post(`/students/${id}/reset-password`);
}
