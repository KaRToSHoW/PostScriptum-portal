import { api } from './client'

export const teachersApi = {
  list:       ()       => api.get('/api/teachers'),
  get:        (id)     => api.get(`/api/teachers/${id}`),
  myStudents: ()       => api.get('/api/teacher/students'),
  enroll:     (body)   => api.post('/api/enrollments', body),
}
