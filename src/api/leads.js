import { api } from './client'

/*
  POST /api/leads  (публичный — со страницы входа)
  Body: { name, phone, email, comment }
  Создаёт заявку «запись через менеджера».
*/
export const leadApi = {
  create: (data) => api.post('/api/leads', data),
}
