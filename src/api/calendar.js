import { api } from './client'

/*
  GET /api/calendar?year=2026&month=5
  Returns: {
    year:   number,
    month:  number,   // 1-based
    events: {
      [day: number]: [{ time, title, lang, status }]
      // status: 'done' | 'missed' | 'now' | 'today' | 'planned'
    }
  }

  GET /api/calendar/admin?year=2026&month=5
  Returns: {
    year:   number,
    month:  number,
    rooms:  [{ id, name }],
    totalLessons: number,
    days: {
      [day: number]: [{ t, l, s, who, room, students }]
    }
  }
*/

export const calendarApi = {
  getMonth:      (year, month) => api.get(`/api/calendar?year=${year}&month=${month}`),
  getAdminMonth: (year, month, teacherId) => api.get(`/api/calendar/admin?year=${year}&month=${month}${teacherId ? `&teacherId=${teacherId}` : ''}`),
}
