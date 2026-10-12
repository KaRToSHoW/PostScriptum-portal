import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'
import { parentApi } from '../api/parent'

const LANG_NAME = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }
const HW_LABEL  = { not_started: 'Не начато', submitted: 'Сдано', done: 'Готово', overdue: 'Просрочено' }
const HW_CHIP   = { not_started: 'orange', submitted: 'blue', done: 'green', overdue: 'red' }

function ChildCard({ c, active, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="ps-card ps-card-lift" style={{
      padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', width: '100%', textAlign: 'left', font: 'inherit',
      border: active ? '2px solid var(--purple)' : '1px solid var(--border-soft)',
      background: active ? 'var(--purple-tint)' : 'var(--bg-paper)',
    }}>
      <div className="ps-avatar" style={{
        width: 48, height: 48, fontSize: 16, flexShrink: 0,
        boxShadow: active ? '0 0 0 2px var(--purple)55, 0 4px 10px var(--purple)33' : 'none',
      }}>{c.initials || c.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{c.courses} язык(ов)</div>
      </div>
      {active && <Icon name="check" size={16} style={{ color: 'var(--purple)', flexShrink: 0 }} />}
    </button>
  )
}

function ChildDashboard({ data }) {
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>Загрузка...</div>
  const next     = data.nextLesson
  const sub      = data.subscription ?? { used: 0, total: 0 }
  const courses  = data.courses ?? []
  const homework = data.homework ?? []
  const schedule = data.schedule ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* верх */}
      <div className="ps-m-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div className="ps-card" style={{ padding: 18 }}>
          <div className="ps-eyebrow">следующий урок</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', marginTop: 6 }}>
            {next ? `${next.dayLabel} · ${next.time}` : '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{next?.teacher ?? 'нет занятий'}</div>
        </div>
        <div className="ps-card" style={{ padding: 18 }}>
          <div className="ps-eyebrow">абонемент</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)', marginTop: 6 }}>{sub.used} из {sub.total}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>уроков использовано</div>
        </div>
        <div className="ps-card" style={{ padding: 18 }}>
          <div className="ps-eyebrow">осталось</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: (sub.total - sub.used) <= 1 ? 'var(--orange-deep)' : 'var(--ink)', marginTop: 6 }}>
            {Math.max(0, sub.total - sub.used)} уроков
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
            {sub.total === 0 ? 'нет активного абонемента' : (sub.total - sub.used) <= 1 ? 'пора продлить абонемент' : 'по абонементу'}
          </div>
        </div>
      </div>

      {/* курсы */}
      <div className="ps-card" style={{ padding: 22 }}>
        <span className="ps-eyebrow">курсы</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {courses.length === 0 && <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Нет активных курсов</div>}
          {courses.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`ps-flag ps-flag-${c.lang}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{c.language}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>с {c.teacher}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* домашка + расписание */}
      <div className="ps-m-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="ps-card" style={{ padding: 22 }}>
          <span className="ps-eyebrow">домашние задания</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {homework.length === 0 && <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Нет заданий</div>}
            {homework.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`ps-flag ps-flag-${h.lang}`} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{h.title}</div>
                <span className={`ps-chip ps-chip-${HW_CHIP[h.status] ?? 'gray'}`}>{HW_LABEL[h.status] ?? h.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ps-card" style={{ padding: 22 }}>
          <span className="ps-eyebrow">расписание</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {schedule.length === 0 && <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Нет уроков</div>}
            {schedule.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>{s.date}</div>
                  <div style={{ fontSize: 9, color: 'var(--ink-muted)', fontWeight: 700 }}>{s.dayLabel}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700 }}>{s.timeFrom} → {s.timeTo}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{LANG_NAME[s.lang] ?? s.lang}</div>
                </div>
                <span className={`ps-flag ps-flag-${s.lang}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Быстрые переходы для выбранного ребёнка: абонементы (покупка) и расписание */
function ChildActions({ child }) {
  const navigate = useNavigate()
  if (!child) return null
  return (
    <div className="ps-card ps-m-wrap" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Icon name="wallet" size={18} style={{ color: 'var(--purple)' }} />
      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', flex: 1, minWidth: 180 }}>{child.name}</div>
      <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={() => navigate('/calendar', { state: { childId: child.id } })}>
        <Icon name="calendar" size={13} /> Расписание
      </button>
      <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => navigate('/billing', { state: { childId: child.id } })}>
        <Icon name="plus" size={13} /> Купить абонемент
      </button>
    </div>
  )
}

export default function ParentPage() {
  const { sideRole } = useApp()
  const [children, setChildren] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [dash, setDash]         = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    parentApi.children()
      .then(list => {
        setChildren(list)
        if (list.length > 0) setActiveId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeId) return
    setDash(null)
    parentApi.childDashboard(activeId).then(setDash).catch(() => {})
  }, [activeId])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Мои дети" />
        <div className="ps-m-pad" style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {!loading && children.length === 0 && (
            <div className="ps-card" style={{ padding: 48, textAlign: 'center', color: 'var(--ink-muted)' }}>
              <Icon name="users" size={32} style={{ color: 'var(--ink-dim)' }} />
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700 }}>Пока нет привязанных детей</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Обратитесь к администратору, чтобы привязать аккаунт ученика</div>
            </div>
          )}

          {children.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {children.map(c => (
                  <ChildCard key={c.id} c={c} active={c.id === activeId} onClick={() => setActiveId(c.id)} />
                ))}
              </div>
              <ChildActions child={children.find(c => c.id === activeId)} />
              <ChildDashboard data={dash} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
