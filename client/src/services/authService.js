import api from './api';

export function login(loginId, password) {
  return api.post('/auth/login', { loginId, password });
}

export function logout() {
  return api.post('/auth/logout');
}

export function refresh() {
  return api.post('/auth/refresh');
}

export function fetchMe() {
  return api.get('/auth/me');
}

export function changePassword(payload) {
  return api.put('/auth/change-password', payload);
}

export function firstLoginPasswordChange(payload) {
  return api.put('/auth/first-login-password', payload);
}

export function forgotPassword(loginId) {
  return api.post('/auth/forgot-password', { loginId });
}

export function verifyResetOtp(loginId, otp) {
  return api.post('/auth/verify-reset-otp', { loginId, otp });
}

export function resetPasswordWithToken(payload) {
  return api.put('/auth/reset-password-with-token', payload);
}
