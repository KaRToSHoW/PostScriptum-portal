import { api } from './client'

export const conferenceApi = {
  lessons: ()         => api.get('/api/conference/lessons'),
  info:    (lessonId) => api.get(`/api/conference/${lessonId}/info`),
  // проверка прав и токен доступа к комнате LiveKit: { userId, role, name, url, token }
  join:    (lessonId) => api.post(`/api/conference/${lessonId}/join`, {}),
  finish:  (lessonId) => api.post(`/api/conference/${lessonId}/finish`, {}),
}
