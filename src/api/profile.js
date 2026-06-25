import { api } from './client'

export const profileApi = {
  get:            ()     => api.get('/api/profile'),
  update:         (body) => api.put('/api/profile', body),
  changePassword: (body) => api.put('/api/profile/password', body),
}
