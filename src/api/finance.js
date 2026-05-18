import { api } from './client'

/*
  GET /api/admin/finance?period=MONTH
  period: WEEK | MONTH | QUARTER | YEAR
  Returns: {
    kpi: [{ label, value, delta, up }],
    revenue: [{ month, langs: [number] }],    // stacked bar data per language
    subscriptions: { active, labels: [string], counts: [number] },
  }

  GET /api/admin/finance/payments?page=0&size=20
  Returns: {
    content: [{ id, student, subscription, amount, date, method, status }],
    totalElements: number,
    totalPages: number,
  }

  POST /api/admin/finance/subscriptions
  Body:    { studentId, planId, startDate }
  Returns: { id, student, plan, startDate, endDate }
*/

export const financeApi = {
  getSummary:  (period)             => api.get(`/api/admin/finance?period=${period}`),
  getPayments: (page = 0, size = 20) => api.get(`/api/admin/finance/payments?page=${page}&size=${size}`),
  createSub:   (body)               => api.post('/api/admin/finance/subscriptions', body),
}
