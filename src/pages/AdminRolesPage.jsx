import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'

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
  const [leads,        setLeads]        = useState([])
  const [accessMatrix, setAccessMatrix] = useState(null)

  // Load team on mount
  useEffect(() => {
    adminApi.team()
      .then(d => setTeam(Array.isArray(d) ? d : []))
      .catch(() => { /* silent */ })
  }, [])

  // Load leads on mount (refetchable)
  const loadLeads = useCallback(() => {
    adminApi.leads()
      .then(d => setLeads(Array.isArray(d) ? d : []))
      .catch(() => { /* silent */ })
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  // Load access matrix on mount
  useEffect(() => {
    adminApi.accessMatrix()
      .then(d => setAccessMatrix(d))
      .catch(() => { /* silent */ })
  }, [])

  // Change lead status and reload
  const handleLeadStatus = useCallback((id, status) => {
    adminApi.leadStatus(id, status)
      .then(() => loadLeads())
      .catch(() => { /* silent */ })
  }, [loadLeads])

  // Convert a lead into a real student account and reload
  const handleConvertLead = useCallback((id) => {
    adminApi.convertLead(id)
      .then(() => loadLeads())
      .catch(() => { /* silent */ })
  }, [loadLeads])

  // Derive access matrix rows from API shape:
  // accessMatrix: { roles:[...], modules:[{ name, permissions:[...] }] }
  const matrixRows = (accessMatrix?.modules ?? []).map(mod => ({
    r: mod.name,
    v: mod.permissions,
  }))

  // First lead is "active" (featured card), rest are in list
  const [firstLead, ...restLeads] = leads

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Роли и распределение нагрузки" />

        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Матрица доступа + Список сотрудников */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22 }}>

            {/* Матрица ролей */}
            <div className="ps-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span className="ps-eyebrow">матрица доступа</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Роли и права</h3>
                </div>
              </div>
              <table className="ps-table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th>Раздел</th>
                    {(accessMatrix?.roles ?? ['Ученик', 'Родитель', 'Препод.', 'Менеджер', 'Админ']).map(role => (
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

            {/* Люди */}
            <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <span className="ps-eyebrow">команда · {team.length} человек</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Кто чем занимается</h3>
                </div>
              </div>

              {/* Фильтры */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  { l: 'Все', n: team.length, a: true }, { l: 'Преподаватели', n: team.filter(t => (t.role || '').toLowerCase().includes('препод') || (t.chip || '') === 'purple').length },
                  { l: 'Менеджеры', n: team.filter(t => (t.role || '').toLowerCase().includes('менедж') || (t.chip || '') === 'orange').length },
                  { l: 'Админы', n: team.filter(t => (t.role || '').toLowerCase().includes('адм')).length },
                  { l: 'Родители', n: team.filter(t => (t.role || '').toLowerCase().includes('родит')).length },
                ].map(f => (
                  <span key={f.l} style={{
                    padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    background: f.a ? 'var(--purple)' : 'var(--bg-cream-soft)',
                    color:      f.a ? '#fff' : 'var(--ink-muted)',
                  }}>{f.l} · {f.n}</span>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {team.length === 0 && (
                  <div style={{ color: 'var(--ink-muted)', fontSize: 13, padding: '12px 0' }}>Нет данных</div>
                )}
                {team.map((p, i) => (
                  <div key={p.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-soft)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {(p.name || '??').split(' ').map(s => s[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{p.role}</div>
                    </div>
                    {p.flag && <span className={`ps-flag ps-flag-${p.flag}`} style={{ width: 18, height: 18 }} />}
                    <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 700, width: 80, textAlign: 'right' }}>
                      {p.weekHours !== undefined ? `${p.weekHours}ч / ${p.capacity}ч` : ''}
                    </div>
                    <span className={`ps-chip ps-chip-${p.chip || 'gray'}`}>{(p.role || '').split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Заявки + Тепловая карта нагрузки */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 22 }}>

            {/* Заявки */}
            <div className="ps-card-purple" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    заявки · {leads.filter(l => l.isNew).length} новых
                  </span>
                  <h3 className="ps-display ps-display-purple" style={{ fontSize: 22, margin: '4px 0 0' }}>Распределить ученика</h3>
                </div>
              </div>

              {/* Первая заявка — активная */}
              {firstLead && (
                <div style={{ marginBottom: 12, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`ps-flag ps-flag-${firstLead.lang}`} />
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: '#fff' }}>{firstLead.name}</div>
                    {firstLead.isNew && <span className="ps-chip ps-chip-orange" style={{ fontSize: 10 }}>Новая</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{firstLead.details}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{firstLead.receivedAt}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="ps-btn ps-btn-primary ps-btn-sm"
                      onClick={() => handleLeadStatus(firstLead.id, 'assigned')}
                    >Назначить</button>
                    <button
                      className="ps-btn ps-btn-outline ps-btn-sm"
                      style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                      onClick={() => handleConvertLead(firstLead.id)}
                    >Конвертировать</button>
                    <button
                      className="ps-btn ps-btn-outline ps-btn-sm"
                      style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                      onClick={() => handleLeadStatus(firstLead.id, 'rejected')}
                    >Отклонить</button>
                  </div>
                </div>
              )}

              {/* Остальные заявки */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leads.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Нет заявок</div>
                )}
                {restLeads.map((l, i) => (
                  <div key={l.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }}>
                    <span className={`ps-flag ps-flag-${l.lang}`} />
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <b>{l.name}</b> · <span style={{ opacity: 0.8 }}>{l.details}</span>
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{l.receivedAt}</span>
                    {l.isNew && <span className="ps-chip ps-chip-orange" style={{ fontSize: 10 }}>NEW</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Тепловая карта нагрузки */}
            <div className="ps-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr) 70px', gap: 6, fontSize: 11, color: 'var(--ink-muted)', fontWeight: 800, paddingBottom: 8, borderBottom: '1px solid var(--border-soft)' }}>
                <div />
                {['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(d => (
                  <div key={d} style={{ textAlign: 'center' }}>{d}</div>
                ))}
                <div style={{ textAlign: 'right' }}>%</div>
              </div>

              {team.length === 0 && (
                <div style={{ color: 'var(--ink-muted)', fontSize: 13, padding: '16px 0' }}>Нет данных</div>
              )}
              {team.map((t, i) => {
                const heatmap  = t.heatmap  ?? [0,0,0,0,0,0,0]
                const cap      = t.capacity ?? 1
                const totalH   = t.total    ?? t.weekHours ?? 0
                return (
                  <div key={t.id ?? i} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr) 70px', gap: 6, padding: '8px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'center' }}>
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
                      {Math.round(totalH / cap * 100)}%
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
