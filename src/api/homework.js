import { api } from './client'

export const homeworkApi = {
  // Ученик
  list:   ()           => api.get('/api/homework'),
  submit: (id, body)   => api.post(`/api/homework/${id}/submit`, body),   // { text, fileUrl }

  // Преподаватель
  teacherList: ()         => api.get('/api/homework/teacher'),             // строка на пару «задание + ученик»
  lessons:     ()         => api.get('/api/homework/lessons'),             // занятия, к которым можно задать ДЗ
  review:      (id, body) => api.post(`/api/homework/${id}/review`, body), // { studentId, grade, feedback }
  create:      (body)     => api.post('/api/homework', body),              // { lessonId, title, description?, dueAt?, attachmentUrl? }
}
