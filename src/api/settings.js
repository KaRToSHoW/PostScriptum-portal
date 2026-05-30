import { api } from './client'

export const settingsApi = {
  get:    ()     => api.get('/api/settings'),
  update: (body) => api.put('/api/settings', body),
}
