import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'

const FALLBACK_TEAM = [
  { id: 1, name: 'Алексей Смирнов',    role: 'Преподаватель', description: 'Французский, английский · B1–C1', chip: 'purple', weekHours: 18, capacity: 24, heatmap: [3,2,4,3,2,0,0] },
  { id: 2, name: 'Мария Козлова',      role: 'Преподаватель', description: 'Немецкий · A1–B2',               chip: 'purple', weekHours: 12, capacity: 20, heatmap: [2,3,2,1,2,0,0] },
  { id: 3, name: 'Екатерина Лебедева', role: 'Преподаватель', description: 'Испанский, французский · A2–C1',  chip: 'purple', weekHours: 16, capacity: 20, heatmap: [3,2,3,3,2,0,0] },
  { id: 4, name: 'Дарья Иванова',      role: 'Менеджер',      description: 'Продажи, работа с клиентами',    chip: 'orange', weekHours: 40, capacity: 40, heatmap: [8,8,8,8,8,0,0] },
  { id: 5, name: 'Кирилл Петров',      role: 'Администратор', description: 'Система, настройки, отчёты',     chip: 'green',  weekHours: 40, capacity: 40, heatmap: [8,8,8,8,8,0,0] },
]

const FALLBACK_MATRIX = {
  roles: ['Ученик', 'Родитель', 'Препод.', 'Менеджер', 'Админ'],
  modules: [
    { name: 'Расписание',    permissions: ['R',   'R',   'R/W', 'R/W', 'R/W'] },
    { name: 'Домашние зад.', permissions: ['R/W', 'R',   'R/W', 'R',   'R/W'] },
    { name: 'Абонементы',    permissions: ['R',   'R',   '—',   'R/W', 'R/W'] },
    { name: 'Финансы',       permissions: ['—',   '—',   'R',   'R/W', 'R/W'] },
    { name: 'Пользователи',  permissions: ['—',   '—',   '—',   'R',   'R/W'] },
    { name: 'Роли/доступ',   permissions: ['—',   '—',   '—',   '—',   'R/W'] },
    { name: 'Сообщения',     permissions: ['R/W', 'R/W', 'R/W', 'R/W', 'R/W'] },
    { name: 'Отчёты',        permissions: ['—',   '—',   'R',   'R',   'R/W'] },
  ],
}

function roleDescription(p) {
  return p.description ?? (() => {
    const r = (p.role ?? '').toLowerCase()
    if (r.includes('препод')) return 'Проводит уроки, проверяет ДЗ'
    if (r.includes('менедж')) return 'Продажи, работа с клиентами'
    if (r.includes('адм'))    return 'Управление системой и персоналом'
    if (r.includes('родит'))  return 'Мониторинг успехов ребёнка'
    return p.role ?? '—'
  })()
}

/* ── Ячейка доступа ─────────────────────────────────────────── */
function Access({ v }) {
  const norm = (v || '').toString().trim().toUpperCase()
  if (norm === 'R/W' || norm === 'RW') return <span className="ps-chip ps-chip-green"  style={{ fontSize: 10 }}>✓ R/W</span>
  if (norm === 'R')                    return <span className="ps-chip ps-chip-purple" style={{ fontSize: 10 }}>R</span>
  return <span style={{ color: 'var(--ink-dim)', fontWeight: 800 }}>—</span>
}

/* ================================================================
   СТРАНИЦА РОЛИ И НАГРУЗКА
   ================================================================ */
export default function AdminRolesPage() {
  const { sideRole } = useApp()

  const [team,         setTeam]         = useState([])
  const [accessMatrix, setAccessMatrix] = useState(null)

  // Load team on mount
  useEffect(() => {
    adminApi.team()
      .then(d => setTeam(Array.isArray(d) && d.length > 0 ? d : FALLBACK_TEAM))
      .catch(() => setTeam(FALLBACK_TEAM))
  }, [])

  // Load access matrix on mount
  useEffect(() => {
    adminApi.accessMatrix()
      .then(d => setAccessMatrix(d ?? FALLBACK_MATRIX))
      .catch(() => setAccessMatrix(FALLBACK_MATRIX))
  }, [])

  // Derive access matrix rows from API shape:
  // accessMatrix: { roles:[...], modules:[{ name, permissions:[...] }] }
  const matrixRows = (accessMatrix?.modules ?? []).map(mod => ({
    r: mod.name,
    v: mod.permissions,
  }))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Роли и распределение нагрузки" />

        <div className="ps-m-pad" style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Матрица ролей */}
          <div className="ps-card" style={{ padding: 24, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span className="ps-eyebrow">матрица доступа</span>
                <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Роли и права</h3>
              </div>
            </div>
            <div className="ps-tablewrap">
            <table className="ps-table" style={{ fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th>Раздел</th>
                  {(accessMatrix?.roles ?? FALLBACK_MATRIX.roles).map(role => (
                    <th key={role} style={{ textAlign: 'center' }}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '16px 0' }}>
                      Нет данных
                    </td>
                  </tr>
                )}
                {matrixRows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{row.r}</td>
                    {row.v.map((v, vi) => (
                      <td key={vi} style={{ textAlign: 'center' }}>
                        <Access v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Тепловая карта нагрузки преподавателей — на всю ширину */}
          <div className="ps-card" style={{ padding: 24 }}>
              <div className="ps-m-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span className="ps-eyebrow">нагрузка преподавателей · эта неделя</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Кто свободен?</h3>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10, fontWeight: 700, color: 'var(--ink-muted)' }}>
                  {[{ c: 'var(--purple-soft)', l: 'свободно' }, { c: 'var(--purple)', l: 'занято' }, { c: 'var(--orange)', l: 'перегруз' }].map(L => (
                    <span key={L.l} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ width: 10, height: 10, background: L.c }} /> {L.l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Шапка дней */}
              <div className="ps-tablewrap">
              <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr) 70px', gap: 6, minWidth: 520, fontSize: 11, color: 'var(--ink-muted)', fontWeight: 800, paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
                <div />
                {['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(d => (
                  <div key={d} style={{ textAlign: 'center' }}>{d}</div>
                ))}
                <div style={{ textAlign: 'right' }}>%</div>
              </div>

              {team.filter(t => t.roleType === 'TEACHER').length === 0 && (
                <div style={{ color: 'var(--ink-muted)', fontSize: 13, padding: '16px 0' }}>Нет преподавателей</div>
              )}
              {team.filter(t => t.roleType === 'TEACHER').map((t, i) => {
                const heatmap = t.heatmap ?? [0,0,0,0,0,0,0]
                const pct     = t.loadPct ?? 0
                return (
                  <div key={t.id ?? i} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr) 70px', gap: 6, minWidth: 520, padding: '8px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.flag
                        ? <span className={`ps-flag ps-flag-${t.flag}`} style={{ width: 18, height: 18 }} />
                        : <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--info-soft)', display: 'inline-block', flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: 12, fontWeight: 800 }}>
                        {(t.name || '').split(' ')[0]} {(t.name || '').split(' ')[1]?.[0]}.
                      </span>
                    </div>
                    {heatmap.map((v, di) => {
                      const max = 5
                      const p = v / max
                      const bg = t.over && p > 0.8
                        ? 'var(--orange)'
                        : p === 0 ? 'var(--purple-soft)'
                        : `rgba(123,115,204,${0.2 + p * 0.75})`
                      return (
                        <div key={di} style={{ height: 30, borderRadius: 6, background: bg, display: 'grid', placeItems: 'center', color: p > 0.4 ? '#fff' : 'var(--purple-deep)', fontSize: 11, fontWeight: 800 }}>
                          {v || ''}
                        </div>
                      )
                    })}
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: t.over ? 'var(--danger)' : 'var(--ink)' }}>
                      {pct}%
                    </div>
                  </div>
                )
              })}
              </div>
            </div>

        </div>
      </main>
    </div>
  )
}
