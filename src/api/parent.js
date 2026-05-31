import { api } from './client'

export const parentApi = {
  children:      ()    => api.get('/api/parent/children'),
  childDashboard:(id)  => api.get(`/api/parent/child/${id}/dashboard`),
}
