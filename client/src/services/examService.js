import api from './api';

export const listExams = (params) => api.get('/exams', { params });
export const createExam = (payload) => api.post('/exams', payload);
export const publishExam = (id) => api.patch(`/exams/${id}/publish`);
export const completeExam = (id) => api.patch(`/exams/${id}/complete`);
export const lockExam = (id) => api.patch(`/exams/${id}/lock`);

export const listExamSchedules = (params) => api.get('/exam-schedules', { params });
export const createExamSchedule = (payload) => api.post('/exam-schedules', payload);

export const getResultRoster = (params) => api.get('/results/roster', { params });
export const enterMarks = (payload) => api.post('/results/enter', payload);
export const updateResult = (id, payload) => api.patch(`/results/${id}`, payload);
export const getStudentResults = (studentId, params) => api.get(`/results/student/${studentId}`, { params });
