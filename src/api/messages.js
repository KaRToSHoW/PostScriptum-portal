import { api } from './client'

export const messagesApi = {
  conversations: ()         => api.get('/api/messages'),
  thread:        (id)       => api.get(`/api/messages/${id}`),
  send:          (id, body) => api.post(`/api/messages/${id}`, { body }),
  start:         (userId)   => api.post('/api/messages/start', { userId }),
  markRead:      (id)       => api.post(`/api/messages/${id}/read`, {}),
}
