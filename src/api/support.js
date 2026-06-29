import { api } from './client'

export const supportApi = {
  // Получить/создать персональный чат с поддержкой (авто-назначение менеджера)
  start: () => api.post('/api/support/start', {}),
}
