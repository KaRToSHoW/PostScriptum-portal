import { api } from './client'

/*
  GET /api/dashboard/student
  Returns: {
    nextLesson:   { date, time, teacher, topic, zoomUrl },
    streak:       number,
    subscription: { used, total, expiresAt },
    courses:      [{ id, language, level, teacher, nextDate, progress }],
    homework:     [{ id, title, due, status }],
    schedule:     [{ date, dayLabel, timeFrom, timeTo, subject, teacher }],
  }

  GET /api/dashboard/teacher
  Returns: {
    schedule:  [{ date, dayLabel, timeFrom, timeTo, student, subject }],
    attention: [{ studentName, issue, timeAgo, type }],
    workload:  { days: [{ label, pct, today }], totalHours, capacity },
  }
*/

export const dashboardApi = {
  getStudent: () => api.get('/api/dashboard/student'),
  getTeacher: () => api.get('/api/dashboard/teacher'),
}
