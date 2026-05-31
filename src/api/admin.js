import { api } from './client'

export const adminApi = {
  // Финансы
  finance:  (period = 'MONTH')      => api.get(`/api/admin/finance?period=${period}`),
  payments: (page = 0, size = 20)   => api.get(`/api/admin/finance/payments?page=${page}&size=${size}`),

  // Команда / роли / заявки
  team:         ()           => api.get('/api/admin/team'),
  leads:        ()           => api.get('/api/admin/leads'),
  accessMatrix: ()           => api.get('/api/admin/access-matrix'),
  leadStatus:   (id, status) => api.post(`/api/admin/leads/${id}/status`, { status }),
  convertLead:  (id)         => api.post(`/api/admin/leads/${id}/convert`, {}),

  // Ученики
  students: () => api.get('/api/admin/students'),

  // Управление пользователями
  users:       ()             => api.get('/api/admin/users'),
  createUser:  (body)         => api.post('/api/admin/users', body),          // {name,email,password,role}
  setRole:     (id, role)     => api.put(`/api/admin/users/${id}/role`, { role }),
  setActive:   (id, active)   => api.put(`/api/admin/users/${id}/active`, { active }),

  // Связи
  assignTeacher: (body) => api.post('/api/admin/assign-teacher', body),       // {studentId, teacherId, languageCode, level}
  linkParent:    (body) => api.post('/api/admin/link-parent', body),          // {parentId, studentId}
}
