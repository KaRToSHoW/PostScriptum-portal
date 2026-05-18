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
}
