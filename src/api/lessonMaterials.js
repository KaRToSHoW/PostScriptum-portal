import { api } from './client'

/* Материалы к занятию: файлы и ссылки. Ответ list: { canManage, items: [{ id, kind, title, url, size, createdAt, author, canDelete }] } */
export const lessonMaterialsApi = {
  list:   (lessonId)       => api.get(`/api/lessons/${lessonId}/materials`),
  add:    (lessonId, body) => api.post(`/api/lessons/${lessonId}/materials`, body),   // { kind: 'FILE'|'LINK', title, url, size? }
  remove: (lessonId, id)   => api.delete(`/api/lessons/${lessonId}/materials/${id}`),
}
