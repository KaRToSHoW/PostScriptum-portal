import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { calendarApi } from '../api/calendar'
import ApiError from '../components/ApiError'

const LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: '#9DC4A2', es: '#D7A87E', it: '#C9A0DC' }

/* ── события мая (ученик) ──────────────────────────────────── */
const EVENTS_STUDENT = {
  1:  [{ t:'10:00', title:'FR · Анна',      l:'fr', s:'done' }],
  4:  [{ t:'18:30', title:'FR · Анна',      l:'fr', s:'done' }, { t:'19:00', title:'EN · Михаил', l:'en', s:'done' }],
  5:  [{ t:'12:30', title:'FR · Лиза',      l:'fr', s:'done' }],
  6:  [{ t:'15:00', title:'DE · Денис',     l:'de', s:'missed' }],
  7:  [{ t:'10:00', title:'EN · Speaking',  l:'en', s:'done' }, { t:'19:00', title:'FR · Анна', l:'fr', s:'done' }],
  8:  [{ t:'18:00', title:'IT · Олег',      l:'it', s:'done' }],
  11: [{ t:'10:00', title:'FR · Анна',      l:'fr', s:'done' }, { t:'18:30', title:'FR · Лиза', l:'fr', s:'done' }],
  12: [{ t:'10:00', title:'FR · Анна',      l:'fr', s:'today' }, { t:'15:00', title:'FR · пара', l:'fr', s:'now' }, { t:'18:30', title:'FR · Lecture', l:'fr', s:'today' }, { t:'20:00', title:'Speaking', l:'fr', s:'today' }],
  13: [{ t:'12:00', title:'EN · Михаил',    l:'en', s:'planned' }, { t:'19:00', title:'ES · Лиза', l:'es', s:'planned' }],
  14: [{ t:'19:00', title:'EN · Анна',      l:'en', s:'planned' }],
  15: [{ t:'10:00', title:'FR · Кирилл',    l:'fr', s:'planned' }],
  18: [{ t:'18:30', title:'FR · Анна',      l:'fr', s:'planned' }],
  19: [{ t:'10:00', title:'DE · Денис',     l:'de', s:'planned' }, { t:'18:30', title:'FR · Анна', l:'fr', s:'planned' }],
  21: [{ t:'19:00', title:'EN · Михаил',    l:'en', s:'planned' }],
  22: [{ t:'12:00', title:'IT · Олег',      l:'it', s:'planned' }],
  25: [{ t:'10:00', title:'FR · Анна',      l:'fr', s:'planned' }],
  26: [{ t:'18:30', title:'FR · группа',    l:'fr', s:'planned' }],
  27: [{ t:'16:00', title:'ES · Speaking',  l:'es', s:'planned' }],
  28: [{ t:'19:00', title:'EN · Михаил',    l:'en', s:'planned' }],
  30: [{ t:'12:00', title:'FR · Speaking',  l:'fr', s:'planned' }],
}

/* ── вспомогательные ──────────────────────────────────────── */
function buildCells(startOffset = 4, daysInMonth = 31) {
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push({ blank: true })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d })
  while (cells.length % 7) cells.push({ blank: true })
  return cells
}

function eventStyle(s) {
  if (s === 'done')    return { bg: 'var(--success-soft)', color: '#2F5A3D',        strike: false }
  if (s === 'missed')  return { bg: 'var(--danger-soft)',  color: '#7A322C',         strike: true  }
  if (s === 'now')     return { bg: 'var(--orange)',       color: '#fff',            strike: false }
  if (s === 'today')   return { bg: 'var(--orange-soft)',  color: 'var(--orange-deep)', strike: false }
  return                      { bg: 'var(--purple-soft)',  color: 'var(--purple-deep)', strike: false }
}

/* ================================================================
   ВАРИАНТ УЧЕНИКА/ПРЕПОДАВАТЕЛЯ
   ================================================================ */
function CalendarStudent() {
  const cells = buildCells(4, 31)

  return (
    <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>

      {/* Тулбар */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="ps-display" style={{ fontSize: 30, margin: 0 }}>Май 2026</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }}>‹</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm">Сегодня</button>
          <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ width: 32, padding: 8 }}>›</button>
        </div>
        <div style={{ display: 'inline-flex', padding: 4, background: '#fff', borderRadius: 999, border: '1px solid var(--border-soft)' }}>
          {['День','Неделя','Месяц'].map((v, i) => (
            <span key={v} style={{ padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', background: i === 2 ? 'var(--purple)' : 'transparent', color: i === 2 ? '#fff' : 'var(--ink-muted)' }}>{v}</span>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {['fr','en','de','es','it'].map(l => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: '#fff', border: '1px solid var(--border-soft)', fontSize: 11, fontWeight: 800, color: 'var(--ink-2)', cursor: 'pointer' }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: LANG_COLOR[l] }} /> {l.toUpperCase()}
            </span>
          ))}
        </div>
        <button className="ps-btn ps-btn-primary ps-btn-sm"><Icon name="plus" size={12} /> Новый урок</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 22, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Сетка месяца */}
        <div className="ps-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Заголовки дней */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, paddingBottom: 8 }}>
            {['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', padding: '4px 6px' }}>{d}</div>
            ))}
          </div>
          {/* Ячейки */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 4, overflow: 'hidden' }}>
            {cells.map((c, i) => {
              if (c.blank) return <div key={i} />
              const evs = EVENTS_STUDENT[c.d] || []
              const isToday = c.d === 12
              const isPast  = c.d < 12
              return (
                <div key={i} style={{
                  borderRadius: 10,
                  border: isToday ? '2px solid var(--orange)' : '1px solid var(--border-soft)',
                  background: isToday ? 'var(--orange-tint)' : isPast ? 'var(--bg-cream-soft)' : '#fff',
                  padding: 7, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: isToday ? 'var(--orange-deep)' : isPast ? 'var(--ink-muted)' : 'var(--ink)' }}>{c.d}</span>
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
                        <b>{e.t}</b> {e.title}
                      </div>
                    )
                  })}
                  {evs.length > 2 && <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 700, paddingLeft: 4 }}>+{evs.length - 2} ещё</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Правая панель */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          {/* Сегодня */}
          <div className="ps-card-purple" style={{ padding: 20 }}>
            <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>сегодня · вт, 12 мая</span>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 22, margin: '4px 0 12px' }}>4 урока</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { t: '10:00', title: 'FR · Conditionnel', s: 'Завершён',          live: false, done: true  },
                { t: '15:00', title: 'FR · пара (A2)',    s: 'Сейчас в эфире',    live: true,  done: false },
                { t: '18:30', title: 'FR · Lecture',      s: 'Через 3ч',          live: false, done: false },
                { t: '20:00', title: 'Speaking Club',     s: 'Запланирован',      live: false, done: false },
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 10, background: it.live ? 'var(--orange)' : 'rgba(255,255,255,0.08)', border: it.live ? 'none' : '1px solid rgba(255,255,255,0.18)', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, width: 44, flexShrink: 0 }}>{it.t}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{it.title}</div>
                    <div style={{ fontSize: 10, opacity: 0.85 }}>{it.s}</div>
                  </div>
                  {it.live && <Icon name="play" size={14} />}
                  {it.done && <span style={{ color: 'var(--success-soft)' }}><Icon name="check" size={14} /></span>}
                </div>
              ))}
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

            {/* Точечная история */}
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
                { c: 'var(--orange)',      l: 'Сегодня · сейчас' },
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
  const cells = buildCells(4, 31)

  return (
    <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>

      {/* Тулбар */}
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

      {/* KPI */}
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

        {/* Сетка */}
        <div className="ps-card" style={{ padding: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, paddingBottom: 6 }}>
            {['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(d => (
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
                  {/* мини-бар по языкам */}
                  <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', background: 'var(--border-soft)' }}>
                    <div style={{ flex: 4, background: 'var(--purple)' }} />
                    <div style={{ flex: 3, background: 'var(--orange)' }} />
                    <div style={{ flex: 1.5, background: '#9DC4A2' }} />
                    <div style={{ flex: 1, background: '#D7A87E' }} />
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 800, color: isPast ? 'var(--ink-2)' : 'var(--purple-deep)' }}>
                    ₽ {dt.revenue.toLocaleString('ru-RU')}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
                    {dt.paid    > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 800, color: 'var(--success)' }}><span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--success)' }} />{dt.paid}</span>}
                    {dt.pending > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 800, color: 'var(--orange-deep)' }}><span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--orange)' }} />{dt.pending}</span>}
                    {dt.overdue > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 800, color: 'var(--danger)' }}><span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--danger)' }} />{dt.overdue}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Правая панель */}
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

          <div className="ps-card" style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="ps-eyebrow">оплаты дня</span>
              <span className="ps-chip ps-chip-orange">3 ожидают</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
              {[
                { n: 'Анна Соколова',  a: '₽ 2 000',  c: 'green',  l: 'Оплачено · СБП',     lang: 'fr' },
                { n: 'Михаил Орлов',   a: '₽ 16 000', c: 'green',  l: 'Оплачено · карта',    lang: 'en' },
                { n: 'Лиза Кравцова',  a: '₽ 8 000',  c: 'orange', l: 'Ожидает 2ч',          lang: 'fr' },
                { n: 'Денис Орехов',   a: '₽ 4 800',  c: 'orange', l: 'Счёт выставлен',      lang: 'de' },
                { n: 'Игорь Петров',   a: '₽ 4 800',  c: 'red',    l: 'Просрочено 3 дн',     lang: 'en' },
                { n: 'Кирилл Васин',   a: '₽ 2 000',  c: 'green',  l: 'Оплачено · СБП',     lang: 'fr' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-cream-soft)' }}>
                  <span className={`ps-flag ps-flag-${p.lang}`} style={{ width: 18, height: 18 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{p.n}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 700 }}>{p.l}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{p.a}</div>
                  <span className={`ps-chip ps-chip-${p.c}`} style={{ width: 8, height: 8, padding: 0, borderRadius: 999 }} />
                </div>
              ))}
            </div>
            <button className="ps-btn ps-btn-outline ps-btn-sm" style={{ marginTop: 12 }}>
              Все оплаты дня <Icon name="arrow" size={12} />
            </button>
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

  // events.events заменит EVENTS_STUDENT когда бэкенд готов
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
