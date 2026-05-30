import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar   from '../components/Sidebar'
import TopBar    from '../components/TopBar'
import Icon      from '../components/Icon'
import ApiError  from '../components/ApiError'
import { useApp } from '../context/AppContext'
import { teachersApi } from '../api/teachers'
import { toast } from '../components/Toast'

const LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--warning)', es: 'var(--success)', it: 'var(--info)' }

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 6, background: 'var(--border-soft)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  )
}

function StudentCard({ s, onMessage }) {
  const color = LANG_COLOR[s.lang] || 'var(--purple)'
  return (
    <div className="ps-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: color + '22', border: `2px solid ${color}44`,
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color,
        }}>
          {s.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{s.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
            {s.language} · {s.level}
          </div>
        </div>
        <span className={`ps-chip ps-chip-${s.status === 'ACTIVE' ? 'green' : s.status === 'PAUSED' ? 'orange' : 'gray'}`}>
          {s.status === 'ACTIVE' ? 'Активен' : s.status === 'PAUSED' ? 'Пауза' : 'Завершён'}
        </span>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
          <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Прогресс</span>
          <span style={{ fontWeight: 800, color }}>{s.progress}%</span>
        </div>
        <ProgressBar value={s.progress} color={color} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-soft)' }}>
        {s.nextLesson ? (
          <div style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Следующий урок: </span>
            <span style={{ color, fontWeight: 800 }}>{s.nextLesson}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Уроки не запланированы</span>
        )}
        <button
          className="ps-btn ps-btn-ghost ps-btn-sm"
          onClick={() => onMessage(s)}
          style={{ flexShrink: 0 }}
        >
          <Icon name="chat" size={13} /> Написать
        </button>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { sideRole } = useApp()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [langFilter, setLangFilter] = useState('all')

  useEffect(() => {
    teachersApi.myStudents()
      .then(setStudents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleMessage(s) {
    navigate('/messages', { state: {
      teacherName: s.name, teacherInitials: s.initials,
      teacherColor: LANG_COLOR[s.lang] || 'var(--purple)',
      teacherRole: `${s.language} · ${s.level}`,
    }})
  }

  const langs = [...new Set(students.map(s => s.lang))]
  const filtered = langFilter === 'all' ? students : students.filter(s => s.lang === langFilter)
  const active = students.filter(s => s.status === 'ACTIVE').length

  const LANG_LABEL = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Мои ученики" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {error && <ApiError message={error} />}

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего учеников',   v: students.length,   d: 'в базе',          icon: 'users',    color: 'var(--purple-deep)' },
              { l: 'Активных',         v: active,            d: 'занимаются',       icon: 'sparkle',  color: 'var(--success)'     },
              { l: 'Языков',           v: langs.length,      d: 'в работе',         icon: 'globe',    color: 'var(--orange-deep)' },
              { l: 'Средний прогресс', v: students.length
                ? Math.round(students.reduce((s,x) => s + x.progress, 0) / students.length) + '%'
                : '—',                                        d: 'по всем курсам',  icon: 'chart',    color: 'var(--purple)'      },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{loading ? '…' : k.v}</div>
                <div className="delta">{k.d}</div>
              </div>
            ))}
          </div>

          {/* Фильтры */}
          <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream-soft)', borderRadius: 999, border: '1px solid var(--border)', gap: 2, alignSelf: 'flex-start' }}>
            {[{ id: 'all', l: 'Все' }, ...langs.map(l => ({ id: l, l: LANG_LABEL[l] || l.toUpperCase() }))].map(f => (
              <button key={f.id} onClick={() => setLangFilter(f.id)} style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                border: 'none', cursor: 'pointer', transition: 'all .12s',
                background: langFilter === f.id ? 'var(--purple)' : 'transparent',
                color:      langFilter === f.id ? '#fff' : 'var(--ink-muted)',
              }}>{f.l}</button>
            ))}
          </div>

          {/* Список */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
              {students.length === 0 ? 'У вас пока нет учеников' : 'Нет учеников по этому фильтру'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map(s => (
                <StudentCard key={s.id} s={s} onMessage={handleMessage} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
