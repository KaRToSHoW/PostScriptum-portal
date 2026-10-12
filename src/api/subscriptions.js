import { api } from './client'

export const subscriptionsApi = {
  list:  () => api.get('/api/subscriptions'),
  plans: () => api.get('/api/subscriptions/plans'),
  // запрос на покупку: ученик с 18 лет — себе, родитель — ребёнку ({ planId, studentId })
  purchaseRequest: (body) => api.post('/api/subscriptions/purchase-request', body),
}
