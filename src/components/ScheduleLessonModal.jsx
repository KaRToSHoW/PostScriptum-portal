import { useState, useEffect, useMemo } from 'react'
import Icon from './Icon'
import { teachersApi } from '../api/teachers'
import { calendarApi } from '../api/calendar'
import { toast } from './Toast'
import { api } from '../api/client'

/* ── Константы ───────────────────────────────────────────────── */
const LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--warning)', es: 'var(--success)', it: 'var(--info)' }

const DAYS_OF_WEEK = [
  { v: 1, s: 'ПН', full: 'Понедельник' },
  { v: 2, s: 'ВТ', full: 'Вторник'     },
  { v: 3, s: 'СР', full: 'Среда'       },
  { v: 4, s: 'ЧТ', full: 'Четверг'     },
  { v: 5, s: 'ПТ', full: 'Пятница'     },
  { v: 6, s: 'СБ', full: 'Суббота'     },
  { v: 7, s: 'ВС', full: 'Воскресенье' },
]
const DURATIONS   = [30, 45, 60, 90, 120]
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const CAL_HEADERS = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС']
const STATUS_COLOR = { planned: 'var(--purple)', done: 'var(--success)', missed: 'var(--danger)', now: 'var(--orange)' }

/* ── Утилиты ─────────────────────────────────────────────────── */
const timeToMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const minToTime = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function toStr(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function buildCells(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const startOff = (firstDay.getDay() + 6) % 7
  const days     = new Date(year, month, 0).getDate()
  const cells    = []
  for (let i = 0; i < startOff; i++) cells.push({ blank: true })
  for (let d = 1; d <= days; d++)    cells.push({ d })
  while (cells.length % 7)           cells.push({ blank: true })
  return cells
}

function computePreviewDates(daysOfWeek, weeksCount) {
  if (!daysOfWeek.size || weeksCount <= 0) return new Set()
  const result = new Set()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (const dow of daysOfWeek) {
    let date = new Date(today)
    const cur = today.getDay() === 0 ? 7 : today.getDay()
    let diff  = dow - cur
    if (diff <= 0) diff += 7
    date.setDate(date.getDate() + diff)
    for (let i = 0; i < weeksCount; i++) {
      result.add(toStr(date.getFullYear(), date.getMonth() + 1, date.getDate()))
      date.setDate(date.getDate() + 7)
    }
  }
  return result
}

function formatDateLabel(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1].slice(0, 3).toLowerCase()}`
}

/* ── Генерируем слоты от 08:00 до 22:00 с шагом 30 мин ──────── */
const TIME_SLOTS = (() => {
  const slots = []
  for (let h = 8; h <= 22; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`)
    if (h < 22) slots.push(`${String(h).padStart(2,'0')}:30`)
  }
  return slots
})()

/* ================================================================
   TimePicker — спиннер ЧЧ:ММ + быстрые пресеты
   busySlots: [{start: "HH:mm", durationMin: number, label: string}]
   ================================================================ */
function TimePicker({ value, onChange, duration, busySlots = [] }) {
  const curH = value ? parseInt(value.split(':')[0]) : null
  const curM = value ? parseInt(value.split(':')[1]) : null

  function emit(h, m) {
    onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }

  function adjH(d) {
    const h = Math.max(0, Math.min(23, (curH ?? 9) + d))
    onChange(`${String(h).padStart(2,'0')}:${String(curM ?? 0).padStart(2,'0')}`)
  }

  function adjM(d) {
    let m = (curM ?? 0) + d
    let h = curH ?? 9
    if (m < 0)  { m = 59; h = Math.max(0, h - 1) }
    if (m > 59) { m = 0;  h = Math.min(23, h + 1) }
    onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }

  function hasConflict(t) {
    if (!t) return false
    const sMin = timeToMin(t)
    const sEnd = sMin + duration
    return busySlots.some(b => {
      const bStart = timeToMin(b.start)
      const bEnd   = bStart + (b.durationMin ?? 60)
      return sMin < bEnd && sEnd > bStart
    })
  }

  function conflictInfo(t) {
    const sMin = timeToMin(t)
    const sEnd = sMin + duration
    return busySlots.find(b => {
      const bStart = timeToMin(b.start)
      const bEnd   = bStart + (b.durationMin ?? 60)
      return sMin < bEnd && sEnd > bStart
    })
  }

  // Час полностью занят если каждая его минута создаёт конфликт
  function isHourBusy(h) {
    return Array.from({ length: 60 }, (_, m) => m)
      .every(m => hasConflict(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`))
  }

  const conflict  = value ? hasConflict(value) : false
  const conflictB = value && conflict ? conflictInfo(value) : null

  const endMin  = value ? timeToMin(value) + duration : null
  const endTime = endMin !== null ? minToTime(endMin) : null

  const totalMin = 24 * 60
  const barLeft  = value ? timeToMin(value) / totalMin * 100 : 0
  const barWidth = duration / totalMin * 100

  const btnArrow = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1,
    padding: '2px 6px', borderRadius: 6,
    transition: 'color .1s, background .1s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Спиннер ЧЧ:ММ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: conflict ? 'rgba(210,80,80,.06)' : 'var(--bg-cream-soft)',
        border: `1.5px solid ${conflict ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius: 18, padding: '10px 16px', transition: 'border-color .2s',
      }}>

        {/* Часы */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <button style={btnArrow} onClick={() => adjH(1)}>▲</button>
          <input
            type="number" min={0} max={23}
            value={curH !== null ? curH : ''}
            placeholder="--"
            onChange={e => {
              const v = parseInt(e.target.value)
              if (!isNaN(v)) onChange(`${String(Math.max(0, Math.min(23, v))).padStart(2,'0')}:${String(curM ?? 0).padStart(2,'0')}`)
            }}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 44, lineHeight: 1,
              color: curH !== null ? (conflict ? 'var(--danger)' : 'var(--purple-deep)') : 'var(--border)',
              width: 82, textAlign: 'center', letterSpacing: '-0.02em',
              background: 'transparent', border: 'none', outline: 'none',
              appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none',
            }}
          />
          <button style={btnArrow} onClick={() => adjH(-1)}>▼</button>
        </div>

        <span style={{ fontSize: 40, fontWeight: 900, color: curH !== null ? 'var(--ink-muted)' : 'var(--border)', marginBottom: 2, userSelect: 'none' }}>:</span>

        {/* Минуты */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <button style={btnArrow} onClick={() => adjM(1)}>▲</button>
          <input
            type="number" min={0} max={59}
            value={curM !== null ? curM : ''}
            placeholder="--"
            onChange={e => {
              const v = parseInt(e.target.value)
              if (!isNaN(v)) onChange(`${String(curH ?? 9).padStart(2,'0')}:${String(Math.max(0, Math.min(59, v))).padStart(2,'0')}`)
            }}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 44, lineHeight: 1,
              color: curM !== null ? (conflict ? 'var(--danger)' : 'var(--purple-deep)') : 'var(--border)',
              width: 82, textAlign: 'center', letterSpacing: '-0.02em',
              background: 'transparent', border: 'none', outline: 'none',
              appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none',
            }}
          />
          <button style={btnArrow} onClick={() => adjM(-1)}>▼</button>
        </div>

        {/* Правая панель: пресеты минут + строка часов */}
        <div style={{ marginLeft: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Быстрый выбор часа */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {Array.from({ length: 24 }, (_, i) => i).map(h => {
              const busy = isHourBusy(h)
              const sel  = curH === h
              return (
                <button key={h}
                  onClick={() => emit(h, curM ?? 0)}
                  title={busy ? 'Час занят' : undefined}
                  style={{
                    padding: '3px 6px', borderRadius: 7, fontSize: 11, fontWeight: 800,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    background: sel ? 'var(--purple-soft)' : busy ? 'rgba(210,80,80,.08)' : 'transparent',
                    color: sel ? 'var(--purple-deep)' : busy ? 'rgba(210,80,80,.6)' : 'var(--ink-muted)',
                    border: sel ? '1.5px solid rgba(96,80,181,.35)' : '1.5px solid transparent',
                    textDecoration: busy ? 'line-through' : 'none',
                  }}
                >{String(h).padStart(2,'0')}</button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Предупреждение о конфликте */}
      {conflict && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 11,
          background: 'rgba(210,80,80,.08)', border: '1.5px solid rgba(210,80,80,.25)',
          fontSize: 12, fontWeight: 700, color: 'var(--danger)',
        }}>
          <span>⚠</span>
          <span>В это время уже есть занятие{conflictB?.label ? ` (${conflictB.label})` : ''}. Выберите другое время.</span>
        </div>
      )}

      {/* Визуальный таймлайн */}
      {(value || busySlots.length > 0) && (
        <div style={{
          background: conflict ? 'rgba(210,80,80,.04)' : 'rgba(96,80,181,.05)',
          border: `1.5px solid ${conflict ? 'rgba(210,80,80,.2)' : 'rgba(96,80,181,.15)'}`,
          borderRadius: 14, padding: '14px 16px 12px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>

          {/* ── Bar area: 64px tall ── */}
          <div style={{ position: 'relative', height: 64 }}>

            {/* Track */}
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: 30, height: 8, borderRadius: 4,
              background: 'rgba(0,0,0,.08)',
            }} />

            {/* Hour tick marks + labels */}
            {[4, 8, 12, 16, 20].map(h => {
              const pct = (h * 60) / totalMin * 100
              return (
                <div key={h}>
                  <div style={{
                    position: 'absolute', left: `${pct}%`, top: 40,
                    width: 1, height: 6, background: 'rgba(0,0,0,.12)',
                    transform: 'translateX(-50%)',
                  }} />
                  <div style={{
                    position: 'absolute', left: `${pct}%`, top: 48,
                    fontSize: 8, fontWeight: 700, color: 'var(--ink-muted)',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                  }}>{h}:00</div>
                </div>
              )
            })}
            {/* Edges */}
            <div style={{ position: 'absolute', left: 0, top: 48, fontSize: 8, fontWeight: 700, color: 'var(--ink-muted)' }}>00</div>
            <div style={{ position: 'absolute', right: 0, top: 48, fontSize: 8, fontWeight: 700, color: 'var(--ink-muted)' }}>24</div>

            {/* Busy slots — on the track */}
            {busySlots.map((b, i) => {
              const bLeft = Math.max(0, timeToMin(b.start) / totalMin * 100)
              const bW    = Math.min((b.durationMin ?? 60) / totalMin * 100, 100 - bLeft)
              const bEnd  = minToTime(timeToMin(b.start) + (b.durationMin ?? 60))
              return (
                <div key={i} title={`${b.start}–${bEnd}${b.label ? ' · ' + b.label : ''}`} style={{
                  position: 'absolute', top: 26,
                  left: `${bLeft}%`, width: `${Math.max(bW, 1.2)}%`,
                  height: 16, borderRadius: 5,
                  background: 'rgba(210,80,80,.38)',
                  border: '1.5px solid rgba(210,80,80,.55)',
                  zIndex: 1,
                }} />
              )
            })}

            {/* Selected lesson block */}
            {value && (
              <>
                {/* Anchor lines: label → block top */}
                <div style={{
                  position: 'absolute', left: `${barLeft}%`, top: 12, height: 12,
                  borderLeft: `1.5px dashed ${conflict ? 'rgba(210,80,80,.5)' : 'rgba(96,80,181,.4)'}`,
                }} />
                {endTime && (
                  <div style={{
                    position: 'absolute',
                    left: `${Math.min(barLeft + barWidth, 99)}%`, top: 12, height: 12,
                    borderLeft: `1.5px dashed ${conflict ? 'rgba(210,80,80,.5)' : 'rgba(96,80,181,.4)'}`,
                  }} />
                )}

                {/* Block */}
                <div style={{
                  position: 'absolute', top: 22,
                  left: `${barLeft}%`, width: `${Math.max(barWidth, 1.5)}%`,
                  height: 24, borderRadius: 8, minWidth: 10, zIndex: 2,
                  background: conflict ? 'var(--danger)' : 'var(--purple)',
                  boxShadow: `0 3px 10px ${conflict ? 'rgba(210,80,80,.4)' : 'rgba(96,80,181,.45)'}`,
                  transition: 'left .15s, width .15s',
                }} />

                {/* Time labels above anchor lines */}
                <div style={{
                  position: 'absolute', left: `${barLeft}%`, top: 0,
                  transform: 'translateX(-50%)',
                  fontSize: 10, fontWeight: 800,
                  color: conflict ? 'var(--danger)' : 'var(--purple-deep)',
                  whiteSpace: 'nowrap',
                }}>{value}</div>
                {endTime && (
                  <div style={{
                    position: 'absolute',
                    left: `${Math.min(barLeft + barWidth, 97)}%`, top: 0,
                    transform: 'translateX(-50%)',
                    fontSize: 10, fontWeight: 800,
                    color: conflict ? 'var(--danger)' : 'var(--purple-deep)',
                    whiteSpace: 'nowrap',
                  }}>{endTime}</div>
                )}
              </>
            )}
          </div>

          {/* Busy slots list */}
          {busySlots.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {busySlots.map((b, i) => {
                const bEnd = minToTime(timeToMin(b.start) + (b.durationMin ?? 60))
                const ov   = value && (() => {
                  const s = timeToMin(value); const e = s + duration
                  const bs = timeToMin(b.start); const be = bs + (b.durationMin ?? 60)
                  return s < be && e > bs
                })()
                return (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 800,
                    padding: '3px 9px', borderRadius: 7,
                    background: ov ? 'rgba(210,80,80,.14)' : 'rgba(210,80,80,.07)',
                    border: `1px solid ${ov ? 'rgba(210,80,80,.4)' : 'rgba(210,80,80,.2)'}`,
                    color: ov ? 'var(--danger)' : 'rgba(150,50,50,.85)',
                  }}>
                    {b.start}–{bEnd}{b.label ? ` · ${b.label}` : ''}
                  </span>
                )
              })}
            </div>
          )}

          {/* Summary row */}
          {value && endTime && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 8,
              borderTop: '1px solid rgba(96,80,181,.12)', paddingTop: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: conflict ? 'var(--danger)' : 'var(--purple-deep)' }}>{value}</span>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 800 }}>→</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: conflict ? 'var(--danger)' : 'var(--purple-deep)' }}>{endTime}</span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 999, background: conflict ? 'rgba(210,80,80,.1)' : 'var(--purple-soft)', color: conflict ? 'var(--danger)' : 'var(--purple-deep)' }}>{duration} мин</span>
              </div>
              {!conflict && (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)' }}>
                  Следующий урок: <b style={{ color: 'var(--purple-deep)', fontWeight: 800 }}>с {endTime}</b>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================
   Основная модалка
   ================================================================ */
export default function ScheduleLessonModal({ student, students: studentsProp, teachers, initialDate, onClose, onDone, defaultTeacherId }) {
  const today    = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toStr(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const initDate = initialDate ? new Date(initialDate + 'T12:00:00') : today
  const [ym, setYm] = useState({ y: initDate.getFullYear(), m: initDate.getMonth() + 1 })

  const isManagerMode = !!(teachers?.length)
  const [selectedTeacherId, setSelectedTeacherId] = useState(defaultTeacherId ?? '')
  const [teacherStudents,   setTeacherStudents]   = useState([])

  const students = isManagerMode ? teacherStudents : studentsProp

  useEffect(() => {
    if (!selectedTeacherId) { setTeacherStudents([]); return }
    api.get(`/api/manager/teacher/${selectedTeacherId}/students`)
      .then(d => { setTeacherStudents(d); if (!student) setStudentIds(new Set()) })
      .catch(() => {})
  }, [selectedTeacherId])

  const [studentIds,    setStudentIds]    = useState(() => new Set(student ? [student.id] : []))
  const [langCode,      setLangCode]      = useState(student?.langCodes?.[0] ?? '')
  const [mode,          setMode]          = useState('dates')
  const [selectedDays,  setSelectedDays]  = useState(new Set())
  const [selectedDates, setSelectedDates] = useState(new Set())
  const [time,          setTime]          = useState('')
  const [duration,      setDuration]      = useState(60)
  const [periodMode,    setPeriodMode]    = useState('weeks')
  const [weeksCount,    setWeeksCount]    = useState(8)
  const [events,        setEvents]        = useState({})
  const [saving,        setSaving]        = useState(false)

  const firstSelectedId = [...studentIds][0]
  const pickedStudent = student ?? students?.find(s => String(s.id) === String(firstSelectedId))

  function toggleStudent(id) {
    setStudentIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function normLangs(s) {
    if (!s) return []
    return Array.isArray(s.langs) ? s.langs : (s.langs ?? '').split(', ').filter(Boolean)
  }

  // Ученик в списке текущего преподавателя (содержит только языки зачисления к нему)
  const teacherEnrolledStudent = selectedTeacherId && pickedStudent
    ? teacherStudents.find(s => String(s.id) === String(pickedStudent.id))
    : null

  // Если нашли в списке преподавателя — берём его enrolled-языки (гарантированно есть enrollment)
  // Если нет — студент не зачислен к этому преподавателю, показываем языки препода (создать не выйдет)
  const selectedTeacher = isManagerMode
    ? (teachers ?? []).find(t => String(t.id) === selectedTeacherId)
    : null

  const activeLangCodes = teacherEnrolledStudent
    ? (Array.isArray(teacherEnrolledStudent.langCodes) ? teacherEnrolledStudent.langCodes : [])
    : selectedTeacher
      ? (Array.isArray(selectedTeacher.langCodes) ? selectedTeacher.langCodes : [])
      : (pickedStudent?.langCodes ?? [])
  const activeLangs = teacherEnrolledStudent
    ? normLangs(teacherEnrolledStudent)
    : selectedTeacher
      ? normLangs(selectedTeacher)
      : normLangs(pickedStudent)

  const studentNotEnrolledWithTeacher = isManagerMode && selectedTeacherId && pickedStudent && teacherStudents.length > 0 && !teacherEnrolledStudent

  // Sync langCode when teacher or student changes
  useEffect(() => {
    if (activeLangCodes.length > 0 && !activeLangCodes.includes(langCode)) {
      setLangCode(activeLangCodes[0])
    }
  }, [selectedTeacherId, pickedStudent?.id])
  // Режим «по абонементу» имеет смысл только для одного ученика
  const lessonsLeft   = studentIds.size === 1 ? (pickedStudent?.lessonsLeft ?? null) : null

  useEffect(() => {
    if (periodMode === 'subscription' && (lessonsLeft === null || lessonsLeft === undefined)) {
      setPeriodMode('weeks')
    }
  }, [studentIds, lessonsLeft, periodMode])

  useEffect(() => {
    const p = isManagerMode && selectedTeacherId
      ? calendarApi.getAdminMonth(ym.y, ym.m, selectedTeacherId).then(d => d?.days ?? {})
      : calendarApi.getMonth(ym.y, ym.m).then(d => d?.events ?? {})
    p.then(setEvents).catch(() => setEvents({}))
  }, [ym.y, ym.m, selectedTeacherId])

  const autoWeeks      = selectedDays.size > 0 && lessonsLeft ? Math.ceil(lessonsLeft / selectedDays.size) : 0
  const effectiveWeeks = periodMode === 'subscription' ? autoWeeks : weeksCount

  const previewDates = useMemo(() => {
    if (mode !== 'regular') return new Set()
    const all = computePreviewDates(selectedDays, effectiveWeeks)
    if (periodMode === 'subscription' && lessonsLeft !== null) {
      return new Set([...all].sort().slice(0, lessonsLeft))
    }
    return all
  }, [mode, selectedDays, effectiveWeeks, periodMode, lessonsLeft])

  // Дни недели, которые реально попадут в расписание (в режиме абонемента — ограничено)
  const coveredDows = useMemo(() => {
    if (periodMode !== 'subscription' || mode !== 'regular') return selectedDays
    return new Set([...previewDates].map(d => {
      const date = new Date(d + 'T12:00:00')
      return date.getDay() === 0 ? 7 : date.getDay()
    }))
  }, [previewDates, periodMode, mode, selectedDays])

  // Занятые слоты для TimePicker — из событий текущего месяца
  const busySlots = useMemo(() => {
    const result = []
    const seen   = new Set()
    for (const [dayStr, dayEvs] of Object.entries(events)) {
      const d = parseInt(dayStr)
      const date = new Date(ym.y, ym.m - 1, d)
      const dow  = date.getDay() === 0 ? 7 : date.getDay()

      const relevant = mode === 'regular'
        ? selectedDays.has(dow)
        : selectedDates.has(toStr(ym.y, ym.m, d))

      if (!relevant) continue
      for (const e of dayEvs) {
        if (!e.t) continue
        const key = e.t
        if (seen.has(key)) continue
        seen.add(key)
        result.push({ start: e.t, durationMin: 60, label: e.who ?? '' })
      }
    }
    return result
  }, [events, mode, selectedDays, selectedDates, ym])

  const sortedDates = [...selectedDates].sort()

  function toggleDay(dow) {
    setSelectedDays(prev => {
      const next = new Set(prev)
      next.has(dow) ? next.delete(dow) : next.add(dow)
      return next
    })
  }

  function toggleDate(dateStr) {
    if (dateStr <= todayStr) return
    setSelectedDates(prev => {
      const next = new Set(prev)
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr)
      return next
    })
  }

  function prevMonth() { setYm(p => p.m === 1 ? { y: p.y - 1, m: 12 } : { ...p, m: p.m - 1 }) }
  function nextMonth() { setYm(p => p.m === 12 ? { y: p.y + 1, m: 1 } : { ...p, m: p.m + 1 }) }

  const batchLessons = isManagerMode
    ? (body) => api.post('/api/manager/lessons/batch', { teacherId: Number(selectedTeacherId), ...body })
    : (body) => teachersApi.createBatchLessons(body)
  const recurringLessons = isManagerMode
    ? (body) => api.post('/api/manager/lessons/recurring', { teacherId: Number(selectedTeacherId), ...body })
    : (body) => teachersApi.createRecurringLessons(body)

  async function submit() {
    if (isManagerMode && !selectedTeacherId) { toast('Выберите преподавателя', 'warning'); return }
    if (studentIds.size === 0) { toast('Выберите хотя бы одного ученика', 'warning'); return }
    if (!time)      { toast('Выберите время занятия', 'warning'); return }
    const studentIdsPayload = [...studentIds].map(Number)

    if (mode === 'regular') {
      if (selectedDays.size === 0) { toast('Выберите хотя бы один день недели', 'warning'); return }
      setSaving(true)
      try {
        if (periodMode === 'subscription') {
          const res = await batchLessons({
            studentIds: studentIdsPayload,
            dates: [...previewDates].sort(),
            time, durationMin: Number(duration),
            languageCode: langCode || undefined,
          })
          if (res?.skipped?.length) {
            toast(`Создано ${res.createdCount} занятий, конфликты: ${res.skipped.join(', ')}`, 'warning')
          } else {
            toast(`Создано ${res.createdCount} занятий ✓`, 'success')
          }
        } else {
          let totalCreated = 0
          const allSkipped = []
          for (const dow of selectedDays) {
            const res = await recurringLessons({
              studentIds: studentIdsPayload, dayOfWeek: dow, time,
              weeksCount: effectiveWeeks, durationMin: Number(duration),
              languageCode: langCode || undefined,
            })
            totalCreated += res?.createdCount ?? 0
            if (res?.skipped?.length) allSkipped.push(...res.skipped)
          }
          if (allSkipped.length > 0) {
            toast(`Создано ${totalCreated} занятий, пропущено: ${allSkipped.join(', ')}`, 'warning')
          } else {
            toast(`Создано ${totalCreated} занятий ✓`, 'success')
          }
        }
        onDone(); onClose()
      } catch (e) {
        toast(e.message || 'Ошибка при создании занятий', 'error')
      } finally { setSaving(false) }

    } else {
      if (selectedDates.size === 0) { toast('Выберите хотя бы одну дату', 'warning'); return }
      setSaving(true)
      try {
        const res = await batchLessons({
          studentIds: studentIdsPayload, dates: sortedDates, time, durationMin: Number(duration),
          languageCode: langCode || undefined,
        })
        if (res?.skipped?.length) {
          toast(`Создано ${res.createdCount} занятий, конфликты: ${res.skipped.join(', ')}`, 'warning')
        } else {
          toast(`Создано ${res.createdCount} занятий ✓`, 'success')
        }
        onDone(); onClose()
      } catch (e) {
        toast(e.message || 'Ошибка при создании занятий', 'error')
      } finally { setSaving(false) }
    }
  }

  const cells        = buildCells(ym.y, ym.m)
  const totalPreview = previewDates.size
  const submitLabel  = mode === 'regular'
    ? (totalPreview > 0 ? `Назначить ${totalPreview} занятий` : 'Назначить')
    : (selectedDates.size > 0 ? `Назначить ${selectedDates.size} занятий` : 'Назначить')

  const timeConflict = time ? busySlots.some(b => {
    const sMin = timeToMin(time)
    const sEnd = sMin + duration
    const bStart = timeToMin(b.start)
    const bEnd   = bStart + (b.durationMin ?? 60)
    return sMin < bEnd && sEnd > bStart
  }) : false

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.48)', backdropFilter: 'blur(5px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 660, background: '#fff', borderRadius: 22, boxShadow: 'var(--shadow-pop)', overflow: 'hidden', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>

        {/* Шапка */}
        <div className="ps-card-purple" style={{ padding: '18px 24px', flexShrink: 0 }}>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.65)' }}>расписание</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 18, margin: 0 }}>
              {studentIds.size > 1
                ? `Групповое занятие · ${studentIds.size} ${studentIds.size < 5 ? 'ученика' : 'учеников'}`
                : pickedStudent ? `${pickedStudent.name}` : 'Новое занятие'}
            </h3>
            {lessonsLeft !== null && lessonsLeft !== undefined && (
              <span style={{ fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,.18)', padding: '4px 12px', borderRadius: 999, color: '#fff' }}>
                {lessonsLeft} {lessonsLeft === 1 ? 'урок' : lessonsLeft < 5 ? 'урока' : 'уроков'} по абонементу
              </span>
            )}
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Выбор преподавателя (только для менеджера) */}
            {isManagerMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="ps-field-label">Преподаватель</label>
                <select
                  value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14 }}
                >
                  <option value="">Выберите преподавателя</option>
                  {(teachers ?? []).map(t => (
                    <option key={t.id} value={t.id}>{t.name}{t.langs ? ` · ${t.langs}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Выбор учеников (можно несколько — групповой урок) */}
            {!student && (!isManagerMode || selectedTeacherId) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="ps-field-label">
                  Ученики
                  {studentIds.size > 0 && <span style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>— выбрано {studentIds.size}</span>}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--bg-cream-soft)', padding: 6 }}>
                  {(students ?? []).length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '8px 10px' }}>У преподавателя пока нет учеников</div>
                  )}
                  {(students ?? []).map(s => {
                    const sel = studentIds.has(s.id)
                    return (
                      <div key={s.id} onClick={() => toggleStudent(s.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9,
                        cursor: 'pointer', transition: 'background .1s',
                        background: sel ? 'var(--purple-soft)' : 'transparent',
                      }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                          border: sel ? 'none' : '2px solid var(--border)',
                          background: sel ? 'var(--purple)' : '#fff',
                          display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 900,
                        }}>{sel ? '✓' : ''}</span>
                        <span style={{ fontSize: 13, fontWeight: sel ? 800 : 600, color: sel ? 'var(--purple-deep)' : 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--ink-muted)', flexShrink: 0 }}>
                          {s.langs?.length ? (Array.isArray(s.langs) ? s.langs.join(', ') : s.langs) : ''}{s.lessonsLeft ? ` · ${s.lessonsLeft} ур.` : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {studentIds.size > 1 && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple-deep)', background: 'rgba(96,80,181,.08)', border: '1px dashed rgba(96,80,181,.3)', borderRadius: 10, padding: '7px 12px' }}>
                    👥 Групповой урок: все выбранные ученики будут на одном занятии
                  </div>
                )}
              </div>
            )}

            {/* Предупреждение: ученик не зачислен к этому преподавателю */}
            {studentNotEnrolledWithTeacher && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(210,80,80,.08)', border: '1.5px solid rgba(210,80,80,.25)', fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>
                ⚠ Этот ученик не зачислен к выбранному преподавателю. Урок создать не получится.
              </div>
            )}

            {/* Выбор языка — только если у ученика/преподавателя 2+ языка */}
            {pickedStudent && activeLangCodes.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="ps-field-label">Язык урока</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {activeLangCodes.map((code, i) => {
                    const name = activeLangs[i] || code
                    const c = LANG_COLOR[code] || 'var(--purple)'
                    const sel = langCode === code
                    return (
                      <button key={code} onClick={() => setLangCode(code)} style={{
                        padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                        background: sel ? c : c + '18', color: sel ? '#fff' : c,
                        outline: sel ? `2px solid ${c}` : 'none', outlineOffset: 1,
                      }}>{name}</button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Вкладки */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[['regular', 'По регулярному расписанию'], ['dates', 'По конкретным датам']].map(([v, label]) => (
                <button key={v} onClick={() => setMode(v)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  background: mode === v ? 'var(--purple)' : 'var(--bg-cream-soft)',
                  color: mode === v ? '#fff' : 'var(--ink-muted)',
                  border: mode === v ? '2px solid var(--purple)' : '2px solid var(--border)',
                }}>{label}</button>
              ))}
            </div>

            {/* ── ВСТРОЕННЫЙ КАЛЕНДАРЬ ── */}
            <div style={{ background: 'var(--bg-cream-soft)', borderRadius: 16, border: '1.5px solid var(--border)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-muted)', padding: '2px 10px', borderRadius: 8 }}>‹</button>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                  {MONTH_NAMES[ym.m - 1]} {ym.y}
                </span>
                <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-muted)', padding: '2px 10px', borderRadius: 8 }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
                {CAL_HEADERS.map(h => (
                  <div key={h} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em' }}>{h}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {cells.map((c, i) => {
                  if (c.blank) return <div key={i} />
                  const str       = toStr(ym.y, ym.m, c.d)
                  const isPast    = str < todayStr
                  const isToday   = str === todayStr
                  const isPreview = mode === 'regular' && previewDates.has(str)
                  const isSel     = mode === 'dates'   && selectedDates.has(str)
                  const dayEvs    = events[c.d] ?? []
                  return (
                    <div
                      key={i}
                      onClick={() => mode === 'dates' && !isPast && toggleDate(str)}
                      style={{
                        height: 52, borderRadius: 10, padding: '6px 4px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        cursor: mode === 'dates' && !isPast ? 'pointer' : 'default',
                        background: isSel     ? 'var(--purple)'
                                  : isPreview ? 'rgba(96,80,181,.12)'
                                  : isToday   ? 'var(--orange-tint)'
                                  : '#fff',
                        border: isSel    ? '2px solid var(--purple)'
                               : isToday  ? '2px solid var(--orange)'
                               : '1.5px solid transparent',
                        opacity: isPast ? 0.38 : 1,
                        transition: 'background .12s, border-color .12s',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: isSel ? '#fff' : isPreview ? 'var(--purple-deep)' : isToday ? 'var(--orange-deep)' : 'var(--ink)' }}>{c.d}</span>
                      {dayEvs.length > 0 && (
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {dayEvs.slice(0, 3).map((e, ei) => (
                            <span key={ei} style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,.6)' : (STATUS_COLOR[e.s] ?? 'var(--purple)'), flexShrink: 0 }} />
                          ))}
                          {dayEvs.length > 3 && <span style={{ fontSize: 8, fontWeight: 800, color: isSel ? 'rgba(255,255,255,.7)' : 'var(--ink-muted)' }}>+{dayEvs.length - 3}</span>}
                        </div>
                      )}
                      {isPreview && !isSel && <span style={{ width: 8, height: 3, borderRadius: 999, background: 'var(--purple)', opacity: 0.6 }} />}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { c: 'var(--purple)',      l: 'Запланировано' },
                  { c: 'var(--success)',     l: 'Проведено' },
                  { c: 'var(--danger)',      l: 'Пропущено' },
                  { c: 'rgba(96,80,181,.25)', l: mode === 'regular' ? 'Будет создано' : null },
                  { c: 'var(--purple)',      l: mode === 'dates' ? 'Выбрано' : null },
                ].filter(L => L.l).map(L => (
                  <div key={L.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: L.c, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-muted)' }}>{L.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── РЕЖИМ: Регулярное ── */}
            {mode === 'regular' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="ps-field-label">Дни недели</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {DAYS_OF_WEEK.map(d => {
                      const sel     = selectedDays.has(d.v)
                      const covered = coveredDows.has(d.v)
                      const dimmed  = sel && !covered
                      return (
                        <button key={d.v} onClick={() => toggleDay(d.v)}
                          title={dimmed ? `${d.full} — не войдёт в абонемент` : d.full}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 11, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                            background: covered  ? 'var(--purple)'
                                       : dimmed  ? 'rgba(96,80,181,.12)'
                                                 : 'var(--bg-cream-soft)',
                            color: covered  ? '#fff'
                                  : dimmed  ? 'var(--purple)'
                                           : 'var(--ink-muted)',
                            border: covered  ? '2px solid var(--purple)'
                                   : dimmed  ? '2px dashed rgba(96,80,181,.4)'
                                            : '2px solid var(--border)',
                            opacity: dimmed ? 0.6 : 1,
                          }}
                        >{d.s}</button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="ps-field-label">Период</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setPeriodMode('weeks')} style={{
                        flex: 1, padding: '10px 8px', borderRadius: 11, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        background: periodMode === 'weeks' ? 'var(--purple)' : 'var(--bg-cream-soft)',
                        color: periodMode === 'weeks' ? '#fff' : 'var(--ink-muted)',
                        border: periodMode === 'weeks' ? '2px solid var(--purple)' : '2px solid var(--border)',
                      }}>На недели</button>
                      <button
                        onClick={() => lessonsLeft && setPeriodMode('subscription')}
                        disabled={!lessonsLeft}
                        title={!lessonsLeft ? 'Нет активного абонемента' : `${lessonsLeft} уроков`}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 11, fontSize: 12, fontWeight: 800,
                          cursor: lessonsLeft ? 'pointer' : 'not-allowed',
                          background: periodMode === 'subscription' ? 'var(--purple)' : 'var(--bg-cream-soft)',
                          color: periodMode === 'subscription' ? '#fff' : lessonsLeft ? 'var(--ink-muted)' : 'var(--border)',
                          border: periodMode === 'subscription' ? '2px solid var(--purple)' : '2px solid var(--border)',
                          opacity: lessonsLeft ? 1 : 0.5,
                        }}
                      >По абонементу</button>
                    </div>
                  </div>
                  {periodMode === 'weeks' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label className="ps-field-label">Недель</label>
                      <input
                        type="number" min={1} max={52} value={weeksCount}
                        onChange={e => setWeeksCount(Math.max(1, Math.min(52, Number(e.target.value))))}
                        style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  )}
                </div>

                {selectedDays.size > 0 && effectiveWeeks > 0 && (
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(96,80,181,.08)', border: '1.5px solid rgba(96,80,181,.18)', fontSize: 13, color: 'var(--purple-deep)' }}>
                    {periodMode === 'subscription' && lessonsLeft ? (
                      <>
                        <b>{previewDates.size}</b> занятий по абонементу
                        {previewDates.size < selectedDays.size * effectiveWeeks && (
                          <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>
                            {' '}· осталось {lessonsLeft} из {selectedDays.size} дней/нед.
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <b>{previewDates.size}</b> занятий ·{' '}
                        {[...selectedDays].map(v => DAYS_OF_WEEK.find(d => d.v === v)?.s).join(', ')}
                        {` · ${effectiveWeeks} нед.`}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── РЕЖИМ: По датам ── */}
            {mode === 'dates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '8px 12px', borderRadius: 10, background: 'rgba(96,80,181,.06)', border: '1px dashed rgba(96,80,181,.3)' }}>
                  Кликайте по датам в календаре выше. Прошедшие даты недоступны.
                </div>
                {selectedDates.size > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="ps-field-label">Выбрано: {selectedDates.size} {selectedDates.size === 1 ? 'дата' : selectedDates.size < 5 ? 'даты' : 'дат'}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {sortedDates.map(d => (
                        <span key={d} onClick={() => toggleDate(d)} style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999,
                          background: 'var(--purple-soft)', color: 'var(--purple-deep)',
                          fontSize: 12, fontWeight: 800, cursor: 'pointer', border: '1.5px solid rgba(96,80,181,.25)',
                        }}>
                          {formatDateLabel(d)}
                          <span style={{ opacity: 0.6, fontSize: 14, lineHeight: 1 }}>×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Длительность ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="ps-field-label">Длительность занятия</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    background: duration === d ? 'var(--purple)' : 'var(--bg-cream-soft)',
                    color: duration === d ? '#fff' : 'var(--ink-muted)',
                    border: duration === d ? '2px solid var(--purple)' : '2px solid var(--border)',
                  }}>{d} мин</button>
                ))}
              </div>
            </div>

            {/* ── Время (TimePicker) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="ps-field-label">
                Время начала
                {mode === 'dates' && selectedDates.size > 1 && <span style={{ fontWeight: 600, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>— одинаковое для всех дат</span>}
              </label>
              <TimePicker
                value={time}
                onChange={setTime}
                duration={duration}
                busySlots={busySlots}
              />
            </div>

            {/* ── Кнопки ── */}
            <div style={{ display: 'flex', gap: 10, paddingBottom: 4 }}>
              <button className="ps-btn ps-btn-primary" onClick={submit} disabled={saving || timeConflict} style={{ flex: 1, justifyContent: 'center' }}>
                <Icon name="check" size={14} /> {saving ? 'Сохранение...' : submitLabel}
              </button>
              <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
