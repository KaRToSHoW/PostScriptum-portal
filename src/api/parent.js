import { api } from './client'

export const parentApi = {
  children:           ()                 => api.get('/api/parent/children'),
  childDashboard:     (id)               => api.get(`/api/parent/child/${id}/dashboard`),
  childCalendar:      (id, year, month)  => api.get(`/api/parent/child/${id}/calendar?year=${year}&month=${month}`),
  childSubscriptions: (id)               => api.get(`/api/parent/child/${id}/subscriptions`),
}
