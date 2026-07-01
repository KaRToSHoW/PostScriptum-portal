import { api } from './client'

export const teachersApi = {
  list:       ()       => api.get('/api/teachers'),
  get:        (id)     => api.get(`/api/teachers/${id}`),
  myStudents: ()       => api.get('/api/teacher/students'),
  enroll:     (body)   => api.post('/api/enrollments', body),
  earnings:   (period = 'MONTH') => api.get(`/api/teacher/earnings?period=${period}`),

  // Расписание: по регулярным дням, по конкретным датам
  createLesson:           (body) => api.post('/api/teacher/lessons', body),
  createRecurringLessons: (body) => api.post('/api/teacher/lessons/recurring', body),
  createBatchLessons:     (body) => api.post('/api/teacher/lessons/batch', body),     // {studentId, dates:['YYYY-MM-DD',...], time, durationMin}

  // Отмена / перенос урока (только преподаватель)
  cancelLesson:    (id, reason) => api.post(`/api/teacher/lessons/${id}/cancel`, { reason }),
  rescheduleLesson: (id, scheduledAt) => api.post(`/api/teacher/lessons/${id}/reschedule`, { scheduledAt }),

  // Посещаемость
  getRoster:       (id) => api.get(`/api/teacher/lessons/${id}/roster`),
  markAttendance:  (id, records) => api.post(`/api/teacher/lessons/${id}/attendance`, { records }), // [{studentId, attended}]
}

// Подключение к уроку (заглушка под будущую систему конференций) — доступно и ученику, и преподавателю
export const lessonsApi = {
  join: (id) => api.post(`/api/lessons/${id}/join`, {}),
}
