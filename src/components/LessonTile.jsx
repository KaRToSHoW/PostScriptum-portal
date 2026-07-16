import Icon from './Icon'

/* ============================================================
   Плашка урока на фиолетовой панели «Выбранный день»
   (календарь ученика/преподавателя и админа/менеджера)
   ============================================================ */

/* Цвета языков чуть глубже базовых LANG_COLOR — чтобы блок времени
   читался на фиолетовой панели и под белым текстом */
const TIME_BG = {
  fr: '#5B51B8',
  en: '#E2873A',
  de: '#6F9E77',
  es: '#C08A55',
  it: '#A97CC4',
}

const LANG_NAME   = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }
const STATE_LABEL = { done: 'Завершён', missed: 'Пропущен', now: 'Идёт сейчас', today: 'Сегодня', planned: 'Запланирован' }

const STATE_CHIP = {
  done:    { bg: 'rgba(110,231,160,.18)', color: '#8FEBB0' },
  missed:  { bg: 'rgba(255,138,128,.18)', color: '#FFB3AC' },
  now:     { bg: 'rgba(255,255,255,.28)', color: '#fff' },
  today:   { bg: 'rgba(255,255,255,.18)', color: '#fff' },
  planned: { bg: 'rgba(255,255,255,.14)', color: 'rgba(255,255,255,.85)' },
}

/**
 * it      — { t: '18:00', l: 'fr', who: 'Шопен', students?: '...', s: 'planned'|'done'|'missed'|'now'|'today' }
 * actions — [{ icon, iconStyle, label, onClick, danger }]
 */
export default function LessonTile({ it, actions = [] }) {
  const live = it.s === 'now'
  const missed = it.s === 'missed'
  const chip = STATE_CHIP[it.s] || STATE_CHIP.planned

  return (
    <div style={{
      borderRadius: 14,
      background: live ? 'var(--orange)' : 'rgba(255,255,255,.1)',
      border: live ? 'none' : '1px solid rgba(255,255,255,.16)',
      boxShadow: live ? '0 8px 22px rgba(0,0,0,.18)' : 'none',
      opacity: missed ? .8 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px' }}>
        {/* Время — цветной блок языка */}
        <div style={{
          flexShrink: 0, minWidth: 52, textAlign: 'center', padding: '10px 7px', borderRadius: 11,
          background: live ? 'rgba(255,255,255,.24)' : (TIME_BG[it.l] ?? 'rgba(255,255,255,.2)'),
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, lineHeight: 1, color: '#fff' }}>{it.t}</div>
        </div>

        {/* Язык — первая строка на всю ширину; ученик + статус — второй строкой */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span className={`ps-flag ps-flag-${it.l}`} style={{ width: 15, height: 15, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.45)' }} />
            <span style={{
              fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textDecoration: missed ? 'line-through' : 'none',
              textDecorationColor: 'rgba(255,255,255,.5)',
            }}>{LANG_NAME[it.l] ?? it.l}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, minWidth: 0 }}>
            {it.who && <span style={{ flex: 1, fontSize: 11.5, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.who}</span>}
            <span style={{
              flexShrink: 0, marginLeft: it.who ? 0 : 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 999, background: chip.bg, color: chip.color,
            }}>
              {it.s === 'done'   && <Icon name="check" size={9} />}
              {it.s === 'missed' && <span style={{ fontSize: 9, lineHeight: 1 }}>✗</span>}
              {live && <span className="ps-live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />}
              {STATE_LABEL[it.s] ?? it.s}
            </span>
          </div>
          {it.students && <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.students}</div>}
        </div>
      </div>

      {/* Действия */}
      {actions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 12px 11px' }}>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              style={{
                flex: '1 1 30%', minWidth: 104,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, letterSpacing: '.02em',
                background: a.danger ? 'rgba(255,80,80,.24)' : 'rgba(255,255,255,.16)',
                color: a.danger ? '#FFB3AC' : '#fff',
                transition: 'background .12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = a.danger ? 'rgba(255,80,80,.36)' : 'rgba(255,255,255,.26)' }}
              onMouseLeave={e => { e.currentTarget.style.background = a.danger ? 'rgba(255,80,80,.24)' : 'rgba(255,255,255,.16)' }}
            >
              {a.icon && <Icon name={a.icon} size={11} style={a.iconStyle} />} {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
