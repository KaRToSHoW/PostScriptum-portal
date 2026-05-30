import { api } from './client'

export const homeworkApi = {
  // Ученик
  list:   ()           => api.get('/api/homework'),
  submit: (id, body)   => api.post(`/api/homework/${id}/submit`, body),   // { text, fileUrl }

  // Преподаватель
  teacherList: ()         => api.get('/api/homework/teacher'),
  review:      (id, body) => api.post(`/api/homework/${id}/review`, body), // { grade, feedback }
  create:      (body)     => api.post('/api/homework', body),              // { studentId, title, description, dueAt, lessonId? }
}
