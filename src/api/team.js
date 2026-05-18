import { api } from './client'

/*
  GET /api/admin/team
  Returns: [{ id, name, role, flag, chip, weekHours, capacity, heatmap: [number] }]

  GET /api/admin/leads
  Returns: [{ id, name, details, receivedAt, lang, isNew }]

  PATCH /api/admin/team/:id/role
  Body:    { role }
  Returns: { id, role }

  GET /api/admin/access-matrix
  Returns: {
    roles:   [string],
    modules: [{ name, permissions: [boolean] }],
  }
*/

export const teamApi = {
  getTeam:         ()              => api.get('/api/admin/team'),
  getLeads:        ()              => api.get('/api/admin/leads'),
  updateRole:      (id, role)      => api.patch(`/api/admin/team/${id}/role`, { role }),
  getAccessMatrix: ()              => api.get('/api/admin/access-matrix'),
}
