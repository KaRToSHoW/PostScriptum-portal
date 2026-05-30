import { api } from './client'

export const subscriptionsApi = {
  list:  () => api.get('/api/subscriptions'),
  plans: () => api.get('/api/subscriptions/plans'),
}
