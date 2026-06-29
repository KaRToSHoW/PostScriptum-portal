import { api } from './client'

export const teachersApi = {
  list:       ()       => api.get('/api/teachers'),
  get:        (id)     => api.get(`/api/teachers/${id}`),
  myStudents: ()       => api.get('/api/teacher/students'),
  enroll:     (body)   => api.post('/api/enrollments', body),
  earnings:   (period = 'MONTH') => api.get(`/api/teacher/earnings?period=${period}`),

  // Расписание: разовое занятие или регулярные занятия каждую неделю
  createLesson:          (body) => api.post('/api/teacher/lessons', body),           // {studentId, scheduledAt, durationMin?}
  createRecurringLessons: (body) => api.post('/api/teacher/lessons/recurring', body), // {studentId, dayOfWeek, time, weeksCount?, durationMin?}
}
