import { api } from './client'

export const availabilityApi = {
  // окна текущего преподавателя: [{ id, weekday (1=ПН…7=ВС), start: "HH:mm", end: "HH:mm" }]
  mine:      ()        => api.get('/api/teacher/availability'),
  save:      (windows) => api.put('/api/teacher/availability', { windows }),
  // для менеджера и администратора
  ofTeacher: (id)      => api.get(`/api/admin/teachers/${id}/availability`),
}
