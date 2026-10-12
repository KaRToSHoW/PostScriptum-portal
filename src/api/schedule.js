import { api } from './client'

/*
  Подбор времени занятия. body: { teacherId?, studentIds, durationMin, mode: 'dates'|'regular', weeks?, daysPerWeek?, horizonDays? }
  Ответ: { items: [{ date?, days?, time, label, score, reasons: [], localTimes: [{ name, time, zone }] }], windowsDefined, emptyReason? }
*/
export const scheduleApi = {
  suggest: (body) => api.post('/api/schedule/suggest', body),
}
