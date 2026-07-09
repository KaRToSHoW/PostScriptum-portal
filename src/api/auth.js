import { api } from './client'

/*
  POST /api/auth/login
  Body:    { email, password }
  Returns: { token, role, name, initials, subtitle }

  POST /api/auth/register
  Body:    { name, email, password }
  Returns: { token, role, name, initials, subtitle }

  GET /api/auth/me
  Returns: { role, name, initials, subtitle }
*/

export const authApi = {
  login:    (email, password)       => api.post('/api/auth/login',    { email, password }),
  register: (name, email, password) => api.post('/api/auth/register', { name, email, password }),
  me:       ()                      => api.get('/api/auth/me'),
  // Сброс пароля по email: шаг 1 — запросить письмо, шаг 2 — установить пароль по токену из письма
  forgotPassword: (email)              => api.post('/api/auth/forgot-password', { email }),
  resetPassword:  (token, newPassword) => api.post('/api/auth/reset-password',  { token, newPassword }),
}
