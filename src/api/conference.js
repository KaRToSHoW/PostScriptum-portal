import { api } from './client'

export const conferenceApi = {
  lessons: ()               => api.get('/api/conference/lessons'),
  info:    (lessonId)       => api.get(`/api/conference/${lessonId}/info`),
  join:    (lessonId)       => api.post(`/api/conference/${lessonId}/join`, {}),
  leave:   (lessonId)       => api.post(`/api/conference/${lessonId}/leave`, {}),
  finish:  (lessonId)       => api.post(`/api/conference/${lessonId}/finish`, {}),
  signal:  (lessonId, body) => api.post(`/api/conference/${lessonId}/signal`, body),
  signals: (lessonId)       => api.get(`/api/conference/${lessonId}/signals`),
}
