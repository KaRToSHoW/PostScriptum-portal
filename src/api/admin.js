import { api } from './client'

export const adminApi = {
  // Финансы
  finance:  (period = 'MONTH')      => api.get(`/api/admin/finance?period=${period}`),
  payments: (page = 0, size = 20)   => api.get(`/api/admin/finance/payments?page=${page}&size=${size}`),

  // Команда / роли / заявки
  team:        ()          => api.get('/api/admin/team'),
  leads:       ()          => api.get('/api/admin/leads'),
  accessMatrix:()          => api.get('/api/admin/access-matrix'),
  leadStatus:  (id, status)=> api.post(`/api/admin/leads/${id}/status`, { status }),

  // Ученики
  students: () => api.get('/api/admin/students'),
}
