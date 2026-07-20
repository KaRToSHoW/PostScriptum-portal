import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { calendarApi } from '../api/calendar'
import { teachersApi } from '../api/teachers'
import { toast } from '../components/Toast'
import { api } from '../api/client'
import ScheduleLessonModal from '../components/ScheduleLessonModal'
import LessonTile from '../components/LessonTile'
import SlideTabs from '../components/SlideTabs'

const LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: '#9DC4A2', es: '#D7A87E', it: '#C9A0DC' }

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAY_NAMES   = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС']

const LANG_NAME = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }

/* события мая 2026 */
const EVENTS_STUDENT = {}

const STATE_LABEL = { done: 'Завершён', missed: 'Пропущен', now: 'Сейчас', today: 'Сегодня', planned: 'Запланирован' }

function eventStyle(s) {
  if (s === 'done')    return { bg: 'var(--success-soft)', color: '#2F5A3D',             strike: false }
  if (s === 'missed')  return { bg: 'var(--danger-soft)',  color: '#7A322C',             strike: true  }
  if (s === 'now')     return { bg: 'var(--orange)',       color: '#fff',                strike: false }
  if (s === 'today')   return { bg: 'var(--orange-soft)',  color: 'var(--orange-deep)',  strike: false }
  return                      { bg: 'var(--purple-soft)',  color: 'var(--purple-deep)',  strike: false }
}

function buildCells(year, month) {
  const firstDay  = new Date(year, month - 1, 1)
  const startOff  = (firstDay.getDay() + 6) % 7
  const days      = new Date(year, month, 0).getDate()
  const cells     = []
  for (let i = 0; i < startOff; i++) cells.push({ blank: true })
  for (let d = 1; d <= days; d++)    cells.push({ d })
  while (cells.length % 7)           cells.push({ blank: true })
  return cells
}

/* ── Мобильный режим (≤900px) ──────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const fn = e => setMobile(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return mobile
}

/* ── Лента дат по неделям (мобильная замена сетки месяца) ──────── */
function WeekStrip({ ym, selectedDay, events, langFilter, onPick }) {
  const anchor = new Date(ym.y, ym.m - 1, selectedDay || 1)
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
  const now = new Date()
  const sameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  function shift(dir) {
    const d = new Date(anchor)
    d.setDate(anchor.getDate() + dir * 7)
    onPick({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() })
  }

  const label = `${days[0].getDate()} ${MONTH_NAMES[days[0].getMonth()].slice(0, 3).toLowerCase()} — ${days[6].getDate()} ${MONTH_NAMES[days[6].getMonth()].slice(0, 3).toLowerCase()}`

  return (
    <div className="ps-card" style={{ padding: '12px 10px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 10px' }}>
        <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 7 }} onClick={() => shift(-1)}>‹</button>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-2)', letterSpacing: '.03em' }}>{label}</span>
        <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 7 }} onClick={() => shift(1)}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((d, i) => {
          const inMonth = d.getMonth() + 1 === ym.m && d.getFullYear() === ym.y
          const sel     = inMonth && selectedDay === d.getDate()
          const today   = sameDate(d, now)
          const evs     = inMonth ? (events[d.getDate()] || []).filter(e => !langFilter || langFilter.has(e.l)) : []
          return (
            <button
              key={i}
              onClick={() => onPick({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() })}
              style={{
                border: today && !sel ? '2px solid var(--orange)' : '1px solid var(--border-soft)',
                background: sel ? 'var(--purple)' : today ? 'var(--orange-tint)' : '#fff',
                color: sel ? '#fff' : inMonth ? 'var(--ink)' : 'var(--ink-dim)',
                borderRadius: 12, padding: '7px 0 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'background .12s, border-color .12s',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', opacity: .65 }}>{DAY_NAMES[i]}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>{d.getDate()}</span>
              <span style={{ display: 'flex', gap: 2, height: 5 }}>
                {evs.slice(0, 3).map((e, k) => (
                  <span key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: sel ? '#fff' : (LANG_COLOR[e.l] || 'var(--purple)') }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Развёрнутый день с почасовой шкалой (мобильный календарь) ──
   Уроки стоят на своём времени, красная линия — «сейчас»,
   тап по уроку раскрывает/скрывает действия                        */
const TIMELINE_BG = { fr: '#6C63C4', en: '#E2873A', de: '#6F9E77', es: '#C08A55', it: '#A97CC4' }

function DayTimeline({ evs, showNow, buildActions }) {
  const [openIdx, setOpenIdx] = useState(null)
  const HOUR = 56

  const parseMin = t => {
    const [h, m] = String(t || '0:0').split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const sorted = [...evs].sort((a, b) => parseMin(a.t) - parseMin(b.t))
  const startH = Math.min(8,  ...sorted.map(e => Math.floor(parseMin(e.t) / 60)))
  const endH   = Math.max(21, ...sorted.map(e => Math.floor(parseMin(e.t) / 60) + 1))
  const hours  = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i)

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Расставляем блоки по времени, разводим наложения
  let prevBottom = -Infinity
  const blocks = sorted.map((e, i) => {
    let top = (parseMin(e.t) - startH * 60) / 60 * HOUR
    if (top < prevBottom + 6) top = prevBottom + 6
    prevBottom = top + 56
    return { e, top, i }
  })

  const totalH = (endH - startH) * HOUR + 40

  return (
    <div className="ps-card" style={{ padding: '16px 12px', flexShrink: 0 }}>
      <div style={{ position: 'relative', height: totalH }}>
        {/* Часовые линии */}
        {hours.map(h => (
          <div key={h} style={{ position: 'absolute', top: (h - startH) * HOUR, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(-50%)' }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-dim)', width: 38, flexShrink: 0, letterSpacing: '.03em' }}>
              {String(h).padStart(2, '0')}:00
            </span>
            <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          </div>
        ))}

        {/* Красная линия текущего времени */}
        {showNow && nowMin >= startH * 60 && nowMin <= endH * 60 && (
          <div style={{ position: 'absolute', top: (nowMin - startH * 60) / 60 * HOUR, left: 0, right: 0, display: 'flex', alignItems: 'center', zIndex: 3, pointerEvents: 'none', transform: 'translateY(-50%)' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--danger)', width: 38, flexShrink: 0 }}>{nowLabel}</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ flex: 1, height: 2, background: 'var(--danger)', borderRadius: 2 }} />
          </div>
        )}

        {/* Уроки */}
        {blocks.map(({ e, top, i }) => {
          const live    = e.s === 'now'
          const missed  = e.s === 'missed'
          const open    = openIdx === i
          const actions = open ? (buildActions?.(e) ?? []) : []
          return (
            <div
              key={i}
              onClick={() => setOpenIdx(open ? null : i)}
              style={{
                position: 'absolute', top, left: 46, right: 2, zIndex: open ? 4 : 2,
                borderRadius: 13, padding: '9px 12px', cursor: 'pointer',
                background: live ? 'var(--orange)' : (TIMELINE_BG[e.l] ?? 'var(--purple)'),
                opacity: missed && !open ? .72 : 1,
                boxShadow: open ? '0 14px 34px rgba(31,27,58,.3)' : '0 4px 12px rgba(31,27,58,.14)',
                transition: 'box-shadow .15s, opacity .15s',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{e.t}</span>
                <span className={`ps-flag ps-flag-${e.l}`} style={{ width: 14, height: 14, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.45)' }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: missed ? 'line-through' : 'none' }}>
                  {LANG_NAME[e.l] ?? e.l}{e.who ? ` · ${e.who}` : ''}
                </span>
                <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,.22)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {live && <span className="ps-live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                  {e.s === 'missed' ? '✗ ' : e.s === 'done' ? '✓ ' : ''}{STATE_LABEL[e.s] ?? e.s}
                </span>
              </div>
              {e.students && open && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 5 }}>{e.students}</div>
              )}
              {open && actions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }} onClick={ev => ev.stopPropagation()}>
                  {actions.map((a, k) => (
                    <button
                      key={k}
                      onClick={a.onClick}
                      style={{
                        flex: '1 1 30%', minWidth: 96,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800,
                        background: a.danger ? 'rgba(160,30,30,.45)' : 'rgba(255,255,255,.22)',
                        color: '#fff',
                      }}
                    >
                      {a.icon && <Icon name={a.icon} size={11} style={a.iconStyle} />} {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {evs.length === 0 && (
          <div style={{ position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13, fontWeight: 700 }}>
            Нет уроков в этот день
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Почасовая сетка на день/неделю (десктопные режимы) ─────────
   Колонки дней с уроками на своём времени, кликабельные даты в
   шапке, красная линия «сейчас» — как в референсе                 */
function HourGrid({ headerDates, bodyDates, ym, getEvs, selectedDay, onPickDay, onShiftWeek }) {
  const HOUR   = 52
  const GUTTER = 46

  const parseMin = t => {
    const [h, m] = String(t || '0:0').split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const now = new Date()
  const sameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const makeCol = d => {
    const inMonth = d.getMonth() + 1 === ym.m && d.getFullYear() === ym.y
    const evs = inMonth ? (getEvs(d.getDate()) || []) : []
    return { d, inMonth, evs: [...evs].sort((a, b) => parseMin(a.t) - parseMin(b.t)) }
  }
  const cols       = bodyDates.map(makeCol)
  const headerCols = headerDates.map(makeCol)

  const allEvs = cols.flatMap(c => c.evs)
  const startH = Math.min(8,  ...allEvs.map(e => Math.floor(parseMin(e.t) / 60)))
  const endH   = Math.max(21, ...allEvs.map(e => Math.floor(parseMin(e.t) / 60) + 1))
  const hours  = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i)

  const nowMin        = now.getHours() * 60 + now.getMinutes()
  const nowLabel      = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const containsToday = cols.some(c => sameDate(c.d, now))
  const single        = bodyDates.length === 1
  const shownDay      = single ? bodyDates[0] : null
  const totalH        = (endH - startH) * HOUR + 26
  const blockH        = single ? 46 : 42

  return (
    <div className="ps-card" style={{ padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Шапка: всегда вся неделя — по датам можно переключать день,
          стрелки по краям листают недели */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid var(--border-soft)', paddingBottom: 8, flexShrink: 0 }}>
        <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 30, padding: 6, flexShrink: 0 }} onClick={() => onShiftWeek(-1)} title="Предыдущая неделя">‹</button>
        <div style={{ flex: 1, display: 'flex' }}>
          {headerCols.map(({ d, inMonth, evs }, i) => {
            const active = shownDay ? sameDate(d, shownDay) : (inMonth && selectedDay === d.getDate())
            const today  = sameDate(d, now)
            return (
              <div key={i} onClick={() => onPickDay(d)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', padding: '2px 0', userSelect: 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: today ? 'var(--orange-deep)' : 'var(--ink-muted)' }}>
                  {DAY_NAMES[(d.getDay() + 6) % 7]}
                </span>
                <span style={{
                  position: 'relative',
                  width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
                  background: active ? 'var(--purple)' : today ? 'var(--orange)' : 'transparent',
                  color: (active || today) ? '#fff' : inMonth ? 'var(--ink)' : 'var(--ink-dim)',
                  transition: 'background .12s',
                }}>
                  {d.getDate()}
                  {evs.length > 0 && !active && !today && (
                    <span style={{ position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--purple)' }} />
                  )}
                </span>
              </div>
            )
          })}
        </div>
        <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 30, padding: 6, flexShrink: 0 }} onClick={() => onShiftWeek(1)} title="Следующая неделя">›</button>
      </div>

      {/* Тело сетки — скроллится внутри карточки */}
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div style={{ position: 'relative', height: totalH, margin: '12px 0 8px' }}>
          {/* Часовые линии */}
          {hours.map(h => (
            <div key={h} style={{ position: 'absolute', top: (h - startH) * HOUR, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(-50%)' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-dim)', width: GUTTER - 8, flexShrink: 0, letterSpacing: '.03em' }}>
                {String(h).padStart(2, '0')}:00
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
            </div>
          ))}

          {/* Красная линия текущего времени */}
          {containsToday && nowMin >= startH * 60 && nowMin <= endH * 60 && (
            <div style={{ position: 'absolute', top: (nowMin - startH * 60) / 60 * HOUR, left: 0, right: 0, display: 'flex', alignItems: 'center', zIndex: 3, pointerEvents: 'none', transform: 'translateY(-50%)' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--danger)', width: GUTTER - 8, flexShrink: 0 }}>{nowLabel}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
              <span style={{ flex: 1, height: 2, background: 'var(--danger)', borderRadius: 2 }} />
            </div>
          )}

          {/* Колонки дней с уроками */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: GUTTER, right: 0, display: 'flex' }}>
            {cols.map((c, ci) => {
              let prevBottom = -Infinity
              return (
                <div key={ci} style={{ flex: 1, position: 'relative', minWidth: 0, borderLeft: ci > 0 ? '1px dashed var(--border-soft)' : 'none' }}>
                  {c.evs.map((e, ei) => {
                    let top = (parseMin(e.t) - startH * 60) / 60 * HOUR
                    if (top < prevBottom + 4) top = prevBottom + 4
                    prevBottom = top + blockH
                    const live   = e.s === 'now'
                    const missed = e.s === 'missed'
                    return (
                      <div
                        key={ei}
                        onClick={ev => { ev.stopPropagation(); onPickDay(c.d) }}
                        title={`${e.t} · ${LANG_NAME[e.l] ?? e.l}${e.who ? ' · ' + e.who : ''}${e.students ? ' — ' + e.students : ''} · ${STATE_LABEL[e.s] ?? e.s}`}
                        style={{
                          position: 'absolute', top, left: 4, right: 4, height: blockH, zIndex: 2,
                          borderRadius: 10, padding: single ? '7px 12px' : '5px 8px',
                          cursor: 'pointer', overflow: 'hidden', color: '#fff',
                          background: live ? 'var(--orange)' : (TIMELINE_BG[e.l] ?? 'var(--purple)'),
                          opacity: missed ? .68 : 1,
                          boxShadow: '0 3px 10px rgba(31,27,58,.16)',
                        }}
                      >
                        {single ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: '100%' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{e.t}</span>
                            <span className={`ps-flag ps-flag-${e.l}`} style={{ width: 14, height: 14, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.45)' }} />
                            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: missed ? 'line-through' : 'none' }}>
                              {LANG_NAME[e.l] ?? e.l}{e.who ? ` · ${e.who}` : ''}
                            </span>
                            <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,.22)' }}>
                              {e.s === 'missed' ? '✗ ' : e.s === 'done' ? '✓ ' : ''}{STATE_LABEL[e.s] ?? e.s}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, textDecoration: missed ? 'line-through' : 'none' }}>{e.t}</span>
                              {live && <span className="ps-live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />}
                              {e.s === 'missed' && <span style={{ fontSize: 9.5 }}>✗</span>}
                              {e.s === 'done' && <span style={{ fontSize: 9.5 }}>✓</span>}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, opacity: .85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                              {e.who || LANG_NAME[e.l] || ''}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Перенос урока на другое время ─────────────────────────────── */
function RescheduleModal({ lesson, onClose, onDone, rescheduleUrl }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!date || !time) { toast('Укажите дату и время', 'warning'); return }
    setSaving(true)
    try {
      if (rescheduleUrl) {
        await api.post(rescheduleUrl, { scheduledAt: `${date}T${time}:00` })
      } else {
        await teachersApi.rescheduleLesson(lesson.id, `${date}T${time}:00`)
      }
      toast('Урок перенесён ✓', 'success')
      onDone()
      onClose()
    } catch (e) {
      toast(e.message || 'Не удалось перенести урок', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ps-m-pad" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ps-m-full" style={{ width: 400, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>перенос урока</span>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 18, margin: '4px 0 0' }}>Выберите новое время</h3>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Время</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ps-btn ps-btn-primary" onClick={submit} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" size={14} /> {saving ? 'Сохранение...' : 'Перенести'}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Отметка посещаемости ──────────────────────────────────────── */
function AttendanceModal({ lesson, onClose, onDone, rosterUrl, attendanceUrl }) {
  const [roster, setRoster] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = rosterUrl ? api.get(rosterUrl) : teachersApi.getRoster(lesson.id)
    fetch.then(setRoster)
      .catch(() => { toast('Не удалось загрузить список учеников', 'error'); setRoster([]) })
  }, [lesson.id])

  function toggle(studentId) {
    setRoster(prev => prev.map(s => s.studentId === studentId ? { ...s, attended: !s.attended } : s))
  }

  async function submit() {
    setSaving(true)
    try {
      const payload = roster.map(s => ({ studentId: s.studentId, attended: !!s.attended }))
      if (attendanceUrl) {
        await api.post(attendanceUrl, { records: payload })
      } else {
        await teachersApi.markAttendance(lesson.id, payload)
      }
      toast('Посещение отмечено ✓', 'success')
      onDone()
      onClose()
    } catch (e) {
      toast(e.message || 'Не удалось сохранить', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ps-m-pad" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ps-m-full" style={{ width: 400, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>посещение</span>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 18, margin: '4px 0 0' }}>Кто был на уроке?</h3>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roster === null && <div style={{ color: 'var(--ink-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Загрузка...</div>}
          {roster?.length === 0 && <div style={{ color: 'var(--ink-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Нет учеников</div>}
          {roster?.map(s => (
            <div
              key={s.studentId}
              onClick={() => toggle(s.studentId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${s.attended ? 'var(--success)' : 'var(--border)'}`,
                background: s.attended ? 'var(--success-soft)' : 'var(--bg-cream-soft)',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', fontWeight: 800, fontSize: 12, color: 'var(--ink)', flexShrink: 0 }}>
                {s.avatarUrl
                  ? <img src={s.avatarUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : s.initials}
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</span>
              {s.attended
                ? <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: 12 }}>✓ Был(а)</span>
                : <span style={{ color: 'var(--ink-muted)', fontWeight: 700, fontSize: 12 }}>Не был(а)</span>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button className="ps-btn ps-btn-primary" onClick={submit} disabled={saving || !roster?.length} style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   ВАРИАНТ УЧЕНИКА (и преподавателя — со своими действиями)
   ================================================================ */
function CalendarStudent() {
  const { role } = useApp()
  const isTeacher = role === 'teacher'
  const now = new Date()
  const TODAY = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() }
  const [ym, setYm]             = useState({ y: TODAY.y, m: TODAY.m })
  const [selectedDay, setSel]   = useState(TODAY.d)
  const [langFilter, setLang]   = useState(new Set(['fr','en','de','es','it']))
  const [events, setEvents]     = useState({})
  const [rescheduleFor, setRescheduleFor] = useState(null)
  const [attendanceFor, setAttendanceFor] = useState(null)
  const [showSchedule, setShowSchedule]   = useState(false)
  const [myStudents, setMyStudents]       = useState([])
  const isMobile = useIsMobile()
  const [view, setView] = useState('day')    // десктоп: 'day' | 'week' | 'month'

  // Выбор дня из недельной ленты (может указывать на соседний месяц)
  function pickDay({ y, m, d }) {
    if (y !== ym.y || m !== ym.m) setYm({ y, m })
    setSel(d)
  }


  // Даты колонок для почасовой сетки (день / неделя)
  const anchorDate = new Date(ym.y, ym.m - 1, selectedDay || 1)
  const weekDates = (() => {
    const mon = new Date(anchorDate)
    mon.setDate(anchorDate.getDate() - ((anchorDate.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  })()

  // Кнопки действий на плашке урока (для преподавателя)
  function lessonActions(it) {
    const actions = []
    if (isTeacher && it.s === 'planned') {
      actions.push({ icon: 'calendar', label: 'Перенести', onClick: () => setRescheduleFor(it) })
      actions.push({ icon: 'plus', iconStyle: { transform: 'rotate(45deg)' }, label: 'Отменить', danger: true, onClick: () => handleCancel(it) })
    }
    if (isTeacher) {
      actions.push({ icon: 'users', label: 'Посещение', onClick: () => setAttendanceFor(it) })
    }
    return actions
  }

  useEffect(() => {
    if (!isTeacher) return
    teachersApi.myStudents().then(setMyStudents).catch(() => {})
  }, [isTeacher])

  function loadEvents() {
    return calendarApi.getMonth(ym.y, ym.m)
      .then(d => { if (d?.events) setEvents(d.events) })
      .catch(() => {})
  }

  useEffect(() => {
    let alive = true
    calendarApi.getMonth(ym.y, ym.m)
      .then(d => { if (alive && d?.events) setEvents(d.events) })
      .catch(() => {})
    return () => { alive = false }
  }, [ym.y, ym.m])

  async function handleCancel(it) {
    const hoursUntil = it.scheduledAt ? (new Date(it.scheduledAt) - new Date()) / 36e5 : null
    const willCharge = hoursUntil !== null && hoursUntil < 4
    const warning = willCharge
      ? 'До урока меньше 4 часов — он будет списан у ученика как проведённый. Отменить?'
      : 'Отменить урок? Это больше чем за 4 часа до начала — урок не будет списан.'
    if (!window.confirm(warning)) return
    try {
      const res = await teachersApi.cancelLesson(it.id)
      toast(res?.lateCancel ? 'Урок отменён, списан ученику ✓' : 'Урок отменён ✓', 'success')
      loadEvents()
    } catch (e) {
      toast(e.message || 'Не удалось отменить урок', 'error')
    }
  }

  const isToday = (d) => ym.y === TODAY.y && ym.m === TODAY.m && d === TODAY.d
  const isPast  = (d) => ym.y < TODAY.y || (ym.y === TODAY.y && ym.m < TODAY.m) || (ym.y === TODAY.y && ym.m === TODAY.m && d < TODAY.d)

  const cells   = buildCells(ym.y, ym.m)
  const selEvs  = (events[selectedDay] || []).filter(e => langFilter.has(e.l))

  function prevMonth() {
    setYm(p => p.m === 1 ? { y: p.y - 1, m: 12 } : { ...p, m: p.m - 1 })
    setSel(1)
  }
  function nextMonth() {
    setYm(p => p.m === 12 ? { y: p.y + 1, m: 1 } : { ...p, m: p.m + 1 })
    setSel(1)
  }
  function goToday() {
    setYm({ y: TODAY.y, m: TODAY.m })
    setSel(TODAY.d)
  }

  function toggleLang(l) {
    setLang(prev => {
      const next = new Set(prev)
      next.has(l) ? next.delete(l) : next.add(l)
      return next
    })
  }

  const selLabel = selectedDay
    ? `${selectedDay} ${MONTH_NAMES[ym.m - 1].slice(0, 3).toLowerCase()}, ${DAY_NAMES[new Date(ym.y, ym.m - 1, selectedDay).getDay() === 0 ? 6 : new Date(ym.y, ym.m - 1, selectedDay).getDay() - 1]}`
    : null

  return (
    <div className="ps-m-pad" style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>

      {/* Тулбар */}
      <div className="ps-m-wrap" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="ps-display" style={{ fontSize: 30, margin: 0 }}>{MONTH_NAMES[ym.m - 1]} {ym.y}</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }} onClick={prevMonth} title="Предыдущий месяц">‹</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={goToday}>Сегодня</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }} onClick={nextMonth} title="Следующий месяц">›</button>
        </div>
        <SlideTabs
          size="sm"
          tabs={[{ id: 'day', label: 'День' }, { id: 'week', label: 'Неделя' }, { id: 'month', label: 'Месяц' }]}
          value={view}
          onChange={setView}
        />
        <div style={{ flex: 1 }} />
        {isTeacher && (
          <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setShowSchedule(true)}>
            <Icon name="plus" size={13} /> Запланировать урок
          </button>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          {['fr','en','de','es','it'].map(l => (
            <span
              key={l}
              onClick={() => toggleLang(l)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999,
                background: langFilter.has(l) ? LANG_COLOR[l] + '22' : '#fff',
                border: `1px solid ${langFilter.has(l) ? LANG_COLOR[l] : 'var(--border-soft)'}`,
                fontSize: 11, fontWeight: 800, color: langFilter.has(l) ? LANG_COLOR[l] : 'var(--ink-muted)', cursor: 'pointer',
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 3, background: LANG_COLOR[l] }} /> {l.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="ps-m-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 22, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* На мобильном — карусель недели + развёрнутая лента по дням, на десктопе — сетка месяца */}
        {isMobile && view === 'day' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <WeekStrip ym={ym} selectedDay={selectedDay} events={events} langFilter={langFilter} onPick={pickDay} />
            <DayTimeline evs={selEvs} showNow={selectedDay != null && isToday(selectedDay)} buildActions={lessonActions} />
          </div>
        ) : view !== 'month' ? (
          <div className={isMobile ? 'ps-tablewrap' : undefined} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ minWidth: isMobile && view === 'week' ? 640 : 0, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <HourGrid
            headerDates={weekDates}
            bodyDates={view === 'day' ? [anchorDate] : weekDates}
            ym={ym}
            getEvs={dayN => (events[dayN] || []).filter(e => langFilter.has(e.l))}
            selectedDay={selectedDay}
            onPickDay={d => pickDay({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() })}
            onShiftWeek={dir => { const d = new Date(anchorDate); d.setDate(anchorDate.getDate() + dir * 7); pickDay({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }) }}
          />
          </div>
          </div>
        ) : (
        <div className="ps-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="ps-tablewrap" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, paddingBottom: 8, minWidth: 640 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', padding: '4px 6px' }}>{d}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 4, overflow: 'hidden', minWidth: 640 }}>
            {cells.map((c, i) => {
              if (c.blank) return <div key={i} />
              const evs     = (events[c.d] || []).filter(e => langFilter.has(e.l))
              const today   = isToday(c.d)
              const past    = isPast(c.d)
              const sel     = selectedDay === c.d
              const weekend = i % 7 >= 5
              return (
                <div
                  key={i}
                  className="ps-cal-cell"
                  onClick={() => setSel(c.d)}
                  style={{
                    borderRadius: 10,
                    border: today ? '2px solid var(--orange)' : sel ? '2px solid var(--purple)' : '1px solid var(--border-soft)',
                    background: today ? 'var(--orange-tint)' : sel ? 'var(--purple-tint)' : past ? 'var(--bg-cream-soft)' : weekend ? '#FBF6EA' : '#fff',
                    padding: 7, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color .1s, background .1s, box-shadow .1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: today ? 'var(--orange-deep)' : sel ? 'var(--purple-deep)' : past ? 'var(--ink-muted)' : 'var(--ink)' }}>{c.d}</span>
                    {evs.length > 5 && <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--purple)', color: '#fff', padding: '0 5px', borderRadius: 999 }}>+{evs.length - 5}</span>}
                  </div>
                  {evs.slice(0, 5).map((e, ei) => {
                    const st = eventStyle(e.s)
                    return (
                      <div
                        key={ei}
                        title={`${e.t} · ${LANG_NAME[e.l] ?? e.l}${e.who ? ' · ' + e.who : ''} · ${STATE_LABEL[e.s] ?? e.s}`}
                        style={{
                          fontSize: 10.5, fontWeight: 700, padding: '3px 6px', borderRadius: 6,
                          background: st.bg, color: st.color,
                          borderLeft: `3px solid ${LANG_COLOR[e.l]}`,
                          textDecoration: st.strike ? 'line-through' : 'none',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        <b>{e.t}</b>{e.who ? ` ${e.who}` : ''}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          </div>
        </div>
        )}

        {/* Правая панель */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          {/* Выбранный день — на мобильном его заменяет лента по дням */}
          {!isMobile && (
          <div className="ps-card-purple" style={{ padding: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
            <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {selectedDay ? selLabel : 'выберите день'}
            </span>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 12px' }}>
              {selEvs.length > 0 ? `${selEvs.length} ${selEvs.length === 1 ? 'урок' : selEvs.length < 5 ? 'урока' : 'уроков'}` : 'Нет уроков'}
            </h3>
            {selEvs.length === 0 && selectedDay && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>В этот день занятий нет</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 340, paddingRight: 2 }}>
              {selEvs.map((it, i) => <LessonTile key={i} it={it} actions={lessonActions(it)} />)}
            </div>
          </div>
          )}

          {/* Посещаемость */}
          <div className="ps-card" style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="ps-eyebrow">история</span>
              <span className="ps-chip ps-chip-gray">апр — май</span>
            </div>
            <h3 className="ps-display" style={{ fontSize: 18, margin: '0 0 12px' }}>Посещаемость</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[{ v: '21', l: 'Проведено', c: 'var(--success)' }, { v: '1', l: 'Пропуск', c: 'var(--danger)' }, { v: '14', l: 'Впереди', c: 'var(--purple-deep)' }].map(s => (
                <div key={s.l}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {Array.from({ length: 36 }).map((_, i) => {
                const bg = i >= 25 ? 'var(--purple-soft)' : i === 19 ? 'var(--danger-soft)' : 'var(--success-soft)'
                return <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: bg, border: i === 24 ? '2px solid var(--orange)' : 'none' }} />
              })}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
              {[
                { c: 'var(--success)',     l: 'Проведено' },
                { c: 'var(--danger)',      l: 'Пропущено' },
                { c: 'var(--purple-deep)', l: 'Запланировано' },
                { c: 'var(--orange)',      l: 'Сегодня' },
              ].map(L => (
                <div key={L.l} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: L.c, flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink-2)', fontWeight: 700 }}>{L.l}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {rescheduleFor && (
        <RescheduleModal
          lesson={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
          onDone={loadEvents}
        />
      )}

      {attendanceFor && (
        <AttendanceModal
          lesson={attendanceFor}
          onClose={() => setAttendanceFor(null)}
          onDone={loadEvents}
        />
      )}

      {showSchedule && (
        <ScheduleLessonModal
          students={myStudents}
          initialDate={selectedDay ? `${ym.y}-${String(ym.m).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : undefined}
          onClose={() => setShowSchedule(false)}
          onDone={loadEvents}
        />
      )}
    </div>
  )
}

/* ================================================================
   ВАРИАНТ АДМИНИСТРАТОРА
   ================================================================ */
function CalendarAdmin({ canCreate = false }) {
  const now = new Date()
  const TODAY = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() }
  const [ym, setYm]           = useState({ y: TODAY.y, m: TODAY.m })
  const [selectedDay, setSel] = useState(TODAY.d)
  const [days, setDays]       = useState({})
  const [totalLessons, setTotalLessons] = useState(0)
  const [showSchedule,    setShowSchedule]    = useState(false)
  const [teachers,        setTeachers]        = useState([])
  const [filterTeacherId, setFilterTeacherId] = useState('')
  const [rescheduleFor,   setRescheduleFor]   = useState(null)
  const [attendanceFor,   setAttendanceFor]   = useState(null)
  const [showAllPanel,    setShowAllPanel]    = useState(false)
  const isMobile = useIsMobile()
  const [view, setView] = useState('day')    // десктоп: 'day' | 'week' | 'month'

  // Выбор дня из недельной ленты (может указывать на соседний месяц)
  function pickDay({ y, m, d }) {
    if (y !== ym.y || m !== ym.m) setYm({ y, m })
    setSel(d)
    setShowAllPanel(false)
  }


  // Даты колонок для почасовой сетки (день / неделя)
  const anchorDate = new Date(ym.y, ym.m - 1, selectedDay || 1)
  const weekDates = (() => {
    const mon = new Date(anchorDate)
    mon.setDate(anchorDate.getDate() - ((anchorDate.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  })()

  // Кнопки действий на плашке урока (для админа/менеджера)
  function lessonActions(it) {
    if (!(canCreate && it.s !== 'done' && it.s !== 'missed')) return []
    return [
      { icon: 'calendar', label: 'Перенести', onClick: () => setRescheduleFor(it) },
      { icon: 'users', label: 'Посещение', onClick: () => setAttendanceFor(it) },
      { icon: 'plus', iconStyle: { transform: 'rotate(45deg)' }, label: 'Отменить', danger: true,
        onClick: async () => { try { await api.post(`/api/manager/lessons/${it.id}/cancel`, {}); toast('Урок отменён ✓', 'success'); loadEvents() } catch(e) { toast(e.message||'Ошибка', 'error') } } },
    ]
  }

  function loadEvents() {
    calendarApi.getAdminMonth(ym.y, ym.m, filterTeacherId || undefined)
      .then(d => { setDays(d?.days || {}); setTotalLessons(d?.totalLessons || 0) })
      .catch(() => {})
  }

  useEffect(() => {
    let alive = true
    calendarApi.getAdminMonth(ym.y, ym.m, filterTeacherId || undefined)
      .then(d => {
        if (!alive) return
        setDays(d?.days || {})
        setTotalLessons(d?.totalLessons || 0)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [ym.y, ym.m, filterTeacherId])

  useEffect(() => {
    if (canCreate) {
      api.get('/api/manager/teachers').then(d => setTeachers(d)).catch(() => {})
    }
  }, [canCreate])

  const isToday = (d) => ym.y === TODAY.y && ym.m === TODAY.m && d === TODAY.d
  const isPast  = (d) => ym.y < TODAY.y || (ym.y === TODAY.y && ym.m < TODAY.m) || (ym.y === TODAY.y && ym.m === TODAY.m && d < TODAY.d)

  const cells   = buildCells(ym.y, ym.m)
  const selEvs  = days[selectedDay] || []

  function prevMonth() {
    setYm(p => p.m === 1 ? { y: p.y - 1, m: 12 } : { ...p, m: p.m - 1 })
    setSel(1)
  }
  function nextMonth() {
    setYm(p => p.m === 12 ? { y: p.y + 1, m: 1 } : { ...p, m: p.m + 1 })
    setSel(1)
  }
  function goToday() {
    setYm({ y: TODAY.y, m: TODAY.m })
    setSel(TODAY.d)
  }

  const selLabel = selectedDay
    ? `${selectedDay} ${MONTH_NAMES[ym.m - 1].slice(0, 3).toLowerCase()}, ${DAY_NAMES[new Date(ym.y, ym.m - 1, selectedDay).getDay() === 0 ? 6 : new Date(ym.y, ym.m - 1, selectedDay).getDay() - 1]}`
    : null

  return (
    <div className="ps-m-pad" style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>

      <div className="ps-m-wrap" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="ps-display" style={{ fontSize: 30, margin: 0 }}>{MONTH_NAMES[ym.m - 1]} {ym.y}</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }} onClick={prevMonth} title="Предыдущий месяц">‹</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={goToday}>Сегодня</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }} onClick={nextMonth} title="Следующий месяц">›</button>
        </div>
        <SlideTabs
          size="sm"
          tabs={[{ id: 'day', label: 'День' }, { id: 'week', label: 'Неделя' }, { id: 'month', label: 'Месяц' }]}
          value={view}
          onChange={setView}
        />
        <div style={{ flex: 1 }} />
        {canCreate && teachers.length > 0 && (
          <select
            value={filterTeacherId}
            onChange={e => setFilterTeacherId(e.target.value)}
            style={{
              padding: '7px 12px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: filterTeacherId ? 'var(--purple-tint)' : 'var(--bg-cream-soft)',
              fontSize: 13, color: filterTeacherId ? 'var(--purple-deep)' : 'var(--ink-muted)',
              fontFamily: 'var(--font-body)', cursor: 'pointer', outline: 'none',
              borderColor: filterTeacherId ? 'var(--purple)' : 'var(--border)',
            }}
          >
            <option value="">Все преподаватели</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <span className="ps-chip ps-chip-gray">Занятий за месяц · {totalLessons}</span>
        {canCreate && (
          <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setShowSchedule(true)}>
            <Icon name="plus" size={14} /> Создать урок
          </button>
        )}
      </div>

      <div className="ps-m-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 22, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* На мобильном — карусель недели + развёрнутая лента по дням, на десктопе — сетка месяца */}
        {isMobile && view === 'day' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <WeekStrip ym={ym} selectedDay={selectedDay} events={days} onPick={pickDay} />
            <DayTimeline evs={selEvs} showNow={selectedDay != null && isToday(selectedDay)} buildActions={lessonActions} />
          </div>
        ) : view !== 'month' ? (
          <div className={isMobile ? 'ps-tablewrap' : undefined} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ minWidth: isMobile && view === 'week' ? 640 : 0, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <HourGrid
            headerDates={weekDates}
            bodyDates={view === 'day' ? [anchorDate] : weekDates}
            ym={ym}
            getEvs={dayN => days[dayN] || []}
            selectedDay={selectedDay}
            onPickDay={d => pickDay({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() })}
            onShiftWeek={dir => { const d = new Date(anchorDate); d.setDate(anchorDate.getDate() + dir * 7); pickDay({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }) }}
          />
          </div>
          </div>
        ) : (
        <div className="ps-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="ps-tablewrap" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, paddingBottom: 6, minWidth: 640 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', padding: '4px 6px' }}>{d}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 4, overflow: 'hidden', minWidth: 640 }}>
            {cells.map((c, i) => {
              if (c.blank) return <div key={i} />
              const today   = isToday(c.d)
              const past    = isPast(c.d)
              const sel     = selectedDay === c.d
              const evs     = days[c.d] || []
              const weekend = i % 7 >= 5
              return (
                <div
                  key={i}
                  className="ps-cal-cell"
                  onClick={() => { setSel(c.d); setShowAllPanel(false) }}
                  style={{
                    borderRadius: 10, cursor: 'pointer',
                    border: today ? '2px solid var(--orange)' : sel ? '2px solid var(--purple)' : '1px solid var(--border-soft)',
                    background: today ? 'var(--orange-tint)' : sel ? 'var(--purple-tint)' : past ? 'var(--bg-cream-soft)' : weekend ? '#FBF6EA' : '#fff',
                    padding: 7, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden',
                    transition: 'border-color .1s, background .1s, box-shadow .1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: today ? 'var(--orange-deep)' : sel ? 'var(--purple-deep)' : past ? 'var(--ink-muted)' : 'var(--ink)' }}>{c.d}</span>
                    {evs.length > 5
                      ? <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--purple)', color: '#fff', padding: '0px 5px', borderRadius: 999 }}>+{evs.length - 5}</span>
                      : evs.length > 0
                        ? <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)' }}>{evs.length} ур.</span>
                        : null
                    }
                  </div>
                  {evs.slice(0, 5).map((e, ei) => {
                    const st = eventStyle(e.s)
                    return (
                      <div
                        key={ei}
                        title={`${e.t} · ${LANG_NAME[e.l] ?? e.l}${e.who ? ' · ' + e.who : ''}${e.students ? ' — ' + e.students : ''} · ${STATE_LABEL[e.s] ?? e.s}`}
                        style={{
                          fontSize: 10.5, fontWeight: 700, padding: '3px 6px', borderRadius: 6,
                          background: st.bg, color: st.color,
                          borderLeft: `3px solid ${LANG_COLOR[e.l]}`,
                          textDecoration: st.strike ? 'line-through' : 'none',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        <b>{e.t}</b> {e.who}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          </div>
        </div>
        )}

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', minHeight: 0 }}>

          {/* Выбранный день — на мобильном его заменяет лента по дням */}
          {!isMobile && (
          <div className="ps-card-purple" style={{ padding: 20, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {selectedDay ? selLabel : 'выберите день'}
            </span>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 12px' }}>
              {selEvs.length > 0 ? `${selEvs.length} ${selEvs.length === 1 ? 'урок' : selEvs.length < 5 ? 'урока' : 'уроков'}` : 'Нет уроков'}
            </h3>
            {selEvs.length === 0 && selectedDay && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>В этот день занятий нет</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
              {(showAllPanel ? selEvs : selEvs.slice(0, 3)).map((it, i) => (
                <LessonTile key={i} it={it} actions={lessonActions(it)} />
              ))}
            </div>
            {selEvs.length > 3 && (
              <button
                onClick={() => setShowAllPanel(v => !v)}
                style={{ marginTop: 4, background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}
              >
                {showAllPanel ? 'Свернуть' : `Ещё ${selEvs.length - 3} ${selEvs.length - 3 === 1 ? 'урок' : selEvs.length - 3 < 5 ? 'урока' : 'уроков'}`}
              </button>
            )}
          </div>
          )}

          {/* Статистика за месяц */}
          {(() => {
            const allEvs = Object.values(days).flat()
            const done    = allEvs.filter(e => e.s === 'done').length
            const missed  = allEvs.filter(e => e.s === 'missed').length
            const planned = allEvs.filter(e => e.s === 'planned' || e.s === 'today').length
            return (
              <div className="ps-card" style={{ padding: 18, flexShrink: 0 }}>
                <span className="ps-eyebrow">посещаемость за месяц</span>
                <h3 className="ps-display" style={{ fontSize: 18, margin: '6px 0 14px' }}>Статистика</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { v: done,    l: 'Проведено', c: 'var(--success)'     },
                    { v: missed,  l: 'Пропуск',   c: 'var(--danger)'      },
                    { v: planned, l: 'Впереди',   c: 'var(--purple-deep)' },
                  ].map(s => (
                    <div key={s.l}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                  {[
                    { c: 'var(--success)',     l: 'Проведено' },
                    { c: 'var(--danger)',      l: 'Пропущено' },
                    { c: 'var(--purple-deep)', l: 'Запланировано' },
                    { c: 'var(--orange)',      l: 'Сейчас' },
                  ].map(L => (
                    <div key={L.l} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: L.c, flexShrink: 0 }} />
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>{L.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

        </aside>
      </div>

      {showSchedule && (
        <ScheduleLessonModal
          teachers={teachers}
          initialDate={selectedDay ? `${ym.y}-${String(ym.m).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : undefined}
          onClose={() => setShowSchedule(false)}
          onDone={loadEvents}
        />
      )}

      {rescheduleFor && (
        <RescheduleModal
          lesson={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
          onDone={loadEvents}
          rescheduleUrl={`/api/manager/lessons/${rescheduleFor?.id}/reschedule`}
        />
      )}

      {attendanceFor && (
        <AttendanceModal
          lesson={attendanceFor}
          onClose={() => setAttendanceFor(null)}
          onDone={loadEvents}
          rosterUrl={`/api/manager/lessons/${attendanceFor?.id}/roster`}
          attendanceUrl={`/api/manager/lessons/${attendanceFor?.id}/attendance`}
        />
      )}
    </div>
  )
}

export default function CalendarPage() {
  const { role, sideRole } = useApp()

  const isAdmin   = role === 'admin'
  const isManager = role === 'manager'
  const title = (isAdmin || isManager) ? 'Расписание · все занятия' : 'Расписание'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={title} />
        {isAdmin || isManager ? <CalendarAdmin canCreate /> : <CalendarStudent />}
      </main>
    </div>
  )
}
