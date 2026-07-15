import { api } from './client'

export const pushApi = {
  publicKey:   ()          => api.get('/api/push/public-key'),
  subscribe:   (sub)       => api.post('/api/push/subscribe', sub),
  unsubscribe: (endpoint)  => api.post('/api/push/unsubscribe', { endpoint }),
}
