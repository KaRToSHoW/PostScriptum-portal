import { useState, useEffect } from 'react'
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
    <div onClick={onClick} className="ps-card" style={{
      padding: 18, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
      border: active ? '2px solid var(--purple)' : '1px solid var(--border-soft)',
    }}>
      <div className="ps-avatar" style={{ width: 46, height: 46, fontSize: 15 }}>{c.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{c.name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{c.courses} язык(ов) · стрик {c.streak} дн.</div>
      </div>
    </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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
          <div className="ps-eyebrow">серия</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--orange-deep)', marginTop: 6 }}>{data.streak ?? 0} дней 🔥</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>без пропусков</div>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
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
        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
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
              <ChildDashboard data={dash} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
