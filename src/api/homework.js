import { api } from './client'

export const homeworkApi = {
  list: () => api.get('/api/homework'),
}
