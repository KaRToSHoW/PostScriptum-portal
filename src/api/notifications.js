import { api } from './client'

export const notificationsApi = {
  list:        ()   => api.get('/api/notifications'),
  unreadCount: ()   => api.get('/api/notifications/unread-count'),
  markRead:    (id) => api.post(`/api/notifications/${id}/read`, {}),
  markAllRead: ()   => api.post('/api/notifications/read-all', {}),
}
