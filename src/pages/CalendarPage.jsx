import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { calendarApi } from '../api/calendar'
import ApiError from '../components/ApiError'
import { toast } from '../components/Toast'

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

/* ================================================================
   ВАРИАНТ УЧЕНИКА
   ================================================================ */
function CalendarStudent() {
  const TODAY = { y: 2026, m: 5, d: 12 }
  const [ym, setYm]             = useState({ y: TODAY.y, m: TODAY.m })
  const [selectedDay, setSel]   = useState(TODAY.d)
  const [langFilter, setLang]   = useState(new Set(['fr','en','de','es','it']))

  const isToday = (d) => ym.y === TODAY.y && ym.m === TODAY.m && d === TODAY.d
  const isPast  = (d) => ym.y < TODAY.y || (ym.y === TODAY.y && ym.m < TODAY.m) || (ym.y === TODAY.y && ym.m === TODAY.m && d < TODAY.d)
  const isCurMo = ym.y === TODAY.y && ym.m === TODAY.m
  const events  = isCurMo ? EVENTS_STUDENT : {}

  const cells   = buildCells(ym.y, ym.m)
  const selEvs  = (events[selectedDay] || []).filter(e => langFilter.has(e.l))

  function prevMonth() {
    setYm(p => p.m === 1 ? { y: p.y - 1, m: 12 } : { ...p, m: p.m - 1 })
    setSel(null)
  }
  function nextMonth() {
    setYm(p => p.m === 12 ? { y: p.y + 1, m: 1 } : { ...p, m: p.m + 1 })
    setSel(null)
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
    <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>

      {/* Тулбар */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="ps-display" style={{ fontSize: 30, margin: 0 }}>{MONTH_NAMES[ym.m - 1]} {ym.y}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }} onClick={prevMonth}>‹</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={goToday}>Сегодня</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }} onClick={nextMonth}>›</button>
        </div>
        <div style={{ flex: 1 }} />
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 22, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Сетка месяца */}
        <div className="ps-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, paddingBottom: 8 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', padding: '4px 6px' }}>{d}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 4, overflow: 'hidden' }}>
            {cells.map((c, i) => {
              if (c.blank) return <div key={i} />
              const evs     = (events[c.d] || []).filter(e => langFilter.has(e.l))
              const today   = isToday(c.d)
              const past    = isPast(c.d)
              const sel     = selectedDay === c.d
              return (
                <div
                  key={i}
                  onClick={() => setSel(c.d)}
                  style={{
                    borderRadius: 10,
                    border: today ? '2px solid var(--orange)' : sel ? '2px solid var(--purple)' : '1px solid var(--border-soft)',
                    background: today ? 'var(--orange-tint)' : sel ? 'var(--purple-tint)' : past ? 'var(--bg-cream-soft)' : '#fff',
                    padding: 7, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color .1s, background .1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: today ? 'var(--orange-deep)' : sel ? 'var(--purple-deep)' : past ? 'var(--ink-muted)' : 'var(--ink)' }}>{c.d}</span>
                    {evs.length > 2 && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)' }}>+{evs.length}</span>}
                  </div>
                  {evs.slice(0, 2).map((e, ei) => {
                    const st = eventStyle(e.s)
                    return (
                      <div key={ei} style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 4px', borderRadius: 4,
                        background: st.bg, color: st.color,
                        borderLeft: `3px solid ${LANG_COLOR[e.l]}`,
                        textDecoration: st.strike ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        <b>{e.t}</b>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Правая панель */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>

          {/* Выбранный день */}
          <div className="ps-card-purple" style={{ padding: 20, flexShrink: 0 }}>
            <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {selectedDay ? selLabel : 'выберите день'}
            </span>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 12px' }}>
              {selEvs.length > 0 ? `${selEvs.length} ${selEvs.length === 1 ? 'урок' : selEvs.length < 5 ? 'урока' : 'уроков'}` : 'Нет уроков'}
            </h3>
            {selEvs.length === 0 && selectedDay && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>В этот день занятий нет</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selEvs.map((it, i) => {
                const live = it.s === 'now'
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: 10, borderRadius: 10,
                    background: live ? 'var(--orange)' : 'rgba(255,255,255,0.1)',
                    border: live ? 'none' : '1px solid rgba(255,255,255,0.18)',
                    alignItems: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, width: 44, flexShrink: 0 }}>{it.t}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>{LANG_NAME[it.l]}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>{it.who}</div>
                      <div style={{ fontSize: 10, opacity: 0.65, marginTop: 1 }}>{STATE_LABEL[it.s] || it.s}</div>
                    </div>
                    {live && <Icon name="play" size={14} />}
                    {it.s === 'done' && <span style={{ color: 'rgba(255,255,255,.8)' }}><Icon name="check" size={14} /></span>}
                    {it.s === 'missed' && <span style={{ color: '#ffaaaa' }}>✗</span>}
                  </div>
                )
              })}
            </div>
          </div>

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
    </div>
  )
}

/* ================================================================
   ВАРИАНТ АДМИНИСТРАТОРА (с оплатами)
   ================================================================ */
function dayData(d) {
  const base = ((d * 7) % 9)
  return { lessons: base, revenue: base * 2200, paid: Math.max(0, base - (d % 5 === 0 ? 1 : 0)), pending: d % 5 === 0 ? 1 : 0, overdue: d === 8 ? 1 : 0 }
}

function CalendarAdmin() {
  const cells = buildCells(2026, 5)

  return (
    <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="ps-display" style={{ fontSize: 30, margin: 0 }}>Май 2026</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }}>‹</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm">Сегодня</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }}>›</button>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'inline-flex', padding: 4, background: '#fff', borderRadius: 999, border: '1px solid var(--border-soft)' }}>
          {['Занятия','+ Оплаты'].map((v, i) => (
            <span key={v} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', background: i === 1 ? 'var(--purple)' : 'transparent', color: i === 1 ? '#fff' : 'var(--ink-muted)' }}>{v}</span>
          ))}
        </div>
        <span className="ps-chip ps-chip-gray">Все преподаватели · 24</span>
        <span className="ps-chip ps-chip-gray">Все языки</span>
        <button className="ps-btn ps-btn-outline ps-btn-sm"><Icon name="download" size={12} /> Отчёт</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { l: 'Занятий в мае', v: '412',       d: 'из 458 план',  c: null    },
          { l: 'Выручка',       v: '₽ 642 500', d: '+18%',          c: 'green' },
          { l: 'Оплачено',      v: '388',        d: '94%',           c: 'green' },
          { l: 'Ожидает',       v: '17',         d: '₽ 96 800',      c: 'orange'},
          { l: 'Просрочено',    v: '7',          d: '₽ 42 000',      c: 'red'   },
        ].map((k, i) => (
          <div key={i} className="ps-kpi" style={{ padding: '12px 16px' }}>
            <div className="label">{k.l}</div>
            <div className="val" style={{ fontSize: 22 }}>{k.v}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: k.c === 'red' ? 'var(--danger)' : k.c === 'orange' ? 'var(--orange-deep)' : k.c === 'green' ? 'var(--success)' : 'var(--ink-muted)' }}>{k.d}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 22, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="ps-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, paddingBottom: 6 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', padding: '4px 6px' }}>{d}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 4, overflow: 'hidden' }}>
            {cells.map((c, i) => {
              if (c.blank) return <div key={i} />
              const isToday = c.d === 12
              const isPast  = c.d < 12
              const dt = dayData(c.d)
              return (
                <div key={i} style={{
                  borderRadius: 10, cursor: 'pointer',
                  border: isToday ? '2px solid var(--orange)' : '1px solid var(--border-soft)',
                  background: isToday ? 'var(--orange-tint)' : isPast ? 'var(--bg-cream-soft)' : '#fff',
                  padding: 7, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: isToday ? 'var(--orange-deep)' : isPast ? 'var(--ink-muted)' : 'var(--ink)' }}>{c.d}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)' }}>{dt.lessons} ур.</span>
                  </div>
                  <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', background: 'var(--border-soft)' }}>
                    <div style={{ flex: 4, background: 'var(--purple)' }} />
                    <div style={{ flex: 3, background: 'var(--orange)' }} />
                    <div style={{ flex: 1.5, background: '#9DC4A2' }} />
                    <div style={{ flex: 1, background: '#D7A87E' }} />
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 800, color: isPast ? 'var(--ink-2)' : 'var(--purple-deep)' }}>
                    ₽ {dt.revenue.toLocaleString('ru-RU')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          <div className="ps-card" style={{ padding: 20 }}>
            <span className="ps-eyebrow">вт, 12 мая</span>
            <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 12px' }}>День в цифрах</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: 12, background: 'var(--purple-tint)', borderRadius: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple-deep)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Уроков</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--purple-deep)' }}>22</div>
              </div>
              <div style={{ padding: 12, background: 'var(--orange-tint)', borderRadius: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange-deep)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Выручка</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--orange-deep)' }}>₽ 48 400</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ================================================================
   СТРАНИЦА КАЛЕНДАРЯ
   ================================================================ */
export default function CalendarPage() {
  const { role, sideRole } = useApp()

  const isAdmin = role === 'admin'
  const title = isAdmin ? 'Расписание · все занятия' : 'Расписание'

  const { error } = useApi(
    () => isAdmin ? calendarApi.getAdminMonth(2026, 5) : calendarApi.getMonth(2026, 5),
    [isAdmin],
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={title} />
        {error && (
          <div style={{ padding: '12px 28px 0' }}>
            <ApiError message={error} />
          </div>
        )}
        {isAdmin ? <CalendarAdmin /> : <CalendarStudent />}
      </main>
    </div>
  )
}
