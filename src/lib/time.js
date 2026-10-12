/*
  Часовой пояс пользователя из профиля (users.timezone). Сервер уже отдаёт время урока
  в этом поясе; здесь — то, что фронтенд считает сам: «сейчас», время сообщений, дедлайны.
  До загрузки профиля используется пояс браузера.
*/

let userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'

export function setUserTimeZone(tz) {
  if (!tz) return
  try {
    new Intl.DateTimeFormat('ru-RU', { timeZone: tz })
    userTz = tz
  } catch {
    /* неизвестный пояс — оставляем прежний */
  }
}

export function getUserTimeZone() {
  return userTz
}

/**
 * Дата, у которой «локальные» поля (getHours, getDate, …) равны настенному времени
 * в поясе пользователя. Только для отображения и сравнения дней — не для арифметики с UTC.
 */
export function toZoned(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: userTz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(d).map(p => [p.type, p.value])
  )
  return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
}

/** «Сейчас» в поясе пользователя. */
export function zonedNow() {
  return toZoned(new Date())
}

const pad = n => String(n).padStart(2, '0')

/** «18:05» */
export function fmtTime(date) {
  const z = toZoned(date)
  return `${pad(z.getHours())}:${pad(z.getMinutes())}`
}

/** «05.11 18:05» */
export function fmtShortDateTime(date) {
  const z = toZoned(date)
  return `${pad(z.getDate())}.${pad(z.getMonth() + 1)} ${pad(z.getHours())}:${pad(z.getMinutes())}`
}
