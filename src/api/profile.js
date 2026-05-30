import { api } from './client'

export const profileApi = {
  update:         (body) => api.put('/api/profile', body),
  changePassword: (body) => api.put('/api/profile/password', body),
}
