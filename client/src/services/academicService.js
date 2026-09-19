import api from './api';

export const listAcademicYears = () => api.get('/academic-years');
export const createAcademicYear = (payload) => api.post('/academic-years', payload);
export const activateAcademicYear = (id) => api.patch(`/academic-years/${id}/activate`);

export const listClasses = (params) => api.get('/classes', { params });
export const createClass = (payload) => api.post('/classes', payload);
export const updateClass = (id, payload) => api.put(`/classes/${id}`, payload);

export const listSections = (params) => api.get('/sections', { params });
export const createSection = (payload) => api.post('/sections', payload);
export const updateSection = (id, payload) => api.put(`/sections/${id}`, payload);

export const listSubjects = (params) => api.get('/subjects', { params });
export const createSubject = (payload) => api.post('/subjects', payload);
export const updateSubject = (id, payload) => api.put(`/subjects/${id}`, payload);

export const listEnrollments = (params) => api.get('/enrollments', { params });
export const createEnrollment = (payload) => api.post('/enrollments', payload);

export const listTeacherAssignments = (params) => api.get('/teacher-assignments', { params });
export const createTeacherAssignment = (payload) => api.post('/teacher-assignments', payload);
export const listMyAssignments = () => api.get('/teacher-assignments/mine');
