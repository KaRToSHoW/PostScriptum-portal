import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'
import { toast } from '../components/Toast'

// Метки статусов заявок (enum lead_status на бэке)
const LEAD_STATUS = {
  NEW:             { label: 'Новая',        chip: 'orange' },
  IN_PROGRESS:     { label: 'В работе',     chip: 'blue'   },
  TRIAL_SCHEDULED: { label: 'Пробный урок', chip: 'purple' },
  CONVERTED:       { label: 'Ученик',       chip: 'green'  },
  LOST:            { label: 'Отклонена',    chip: 'gray'   },
}

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
/* ============================================================
   Обработка заявки: связаться (телефон) → создать аккаунт → выдать логин/пароль
   ============================================================ */
function LeadModal({ lead, onClose, onChanged }) {
  const [busy, setBusy] = useState('')
  const [creds, setCreds] = useState(null)   // { email, password } после конвертации
  const [status, setLocalStatus] = useState(lead.status)

  const st = LEAD_STATUS[status] ?? LEAD_STATUS.NEW

  function copy(text) {
    navigator.clipboard?.writeText(text)
      .then(() => toast('Скопировано', 'success'))
      .catch(() => {})
  }

  async function setStatus(s) {
    setBusy(s)
    try {
      await adminApi.leadStatus(lead.id, s)
      toast(s === 'LOST' ? 'Заявка отклонена' : 'Взято в работу', 'success')
      setLocalStatus(s)
      onChanged()
      if (s === 'LOST') onClose()
    } catch (e) { toast(e.message || 'Ошибка', 'error') }
    finally { setBusy('') }
  }

  async function convert() {
    setBusy('convert')
    try {
      const r = await adminApi.convertLead(lead.id)
      setCreds({ email: r.email, password: r.password, emailed: r.emailed })
      onChanged()
    } catch (e) { toast(e.message || 'Не удалось создать аккаунт', 'error') }
    finally { setBusy('') }
  }

  const Row = ({ label, value, action }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
        {action}
      </div>
    </div>
  )

  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'grid', placeItems: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>

        <div className="ps-card-purple" style={{ padding: '18px 24px', position: 'relative' }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.15)', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon name="plus" size={13} style={{ transform: 'rotate(45deg)' }} />
          </button>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>заявка · {st.label}</span>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 0' }}>{lead.name}</h3>
        </div>

        {creds ? (
          /* ── Аккаунт создан: логин + пароль для передачи клиенту ── */
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>✅</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Аккаунт создан</div>
            </div>
            <div style={{ background: 'var(--bg-cream-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Row label="Логин (email)" value={creds.email}
                action={<button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => copy(creds.email)}>Копировать</button>} />
              <Row label="Пароль" value={<code style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.04em', color: 'var(--purple-deep)' }}>{creds.password}</code>}
                action={<button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => copy(creds.password)}>Копировать</button>} />
            </div>
            {creds.emailed ? (
              <div style={{ fontSize: 12.5, color: '#2F5A3D', lineHeight: 1.5, background: 'var(--success-soft)', padding: '10px 14px', borderRadius: 10 }}>
                📧 Письмо с доступами отправлено на <b>{creds.email}</b>. Логин и пароль выше — на случай, если понадобится продиктовать.
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.5, background: 'var(--orange-tint)', padding: '10px 14px', borderRadius: 10 }}>
                📞 Передайте логин и пароль клиенту — по телефону, с которого связывались{lead.email ? `, или отправьте на ${lead.email}` : ''}. Пароль временный, клиент сменит его в настройках.
              </div>
            )}
            <button className="ps-btn ps-btn-primary" style={{ justifyContent: 'center' }} onClick={onClose}>Готово</button>
          </div>
        ) : (
          /* ── Данные заявки + действия ── */
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {lead.phone && (
              <Row label="Телефон" value={lead.phone}
                action={<a href={`tel:${lead.phone}`} className="ps-btn ps-btn-primary ps-btn-sm" style={{ textDecoration: 'none' }}><Icon name="phone" size={13} /> Позвонить</a>} />
            )}
            {lead.email && <Row label="Email" value={lead.email}
              action={<button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => copy(lead.email)}>Копировать</button>} />}
            {lead.details && <Row label="Детали" value={lead.details} />}
            {lead.comment && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Комментарий</span>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, background: 'var(--bg-cream-soft)', padding: '10px 12px', borderRadius: 10 }}>{lead.comment}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{lead.source ? `${lead.source} · ` : ''}{lead.receivedAt}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border-soft)', marginTop: 2 }}>
              {status === 'NEW' && (
                <button className="ps-btn ps-btn-outline ps-btn-sm" disabled={!!busy} onClick={() => setStatus('IN_PROGRESS')}>
                  <Icon name="check" size={13} /> В работу
                </button>
              )}
              {status !== 'CONVERTED' && (
                <button className="ps-btn ps-btn-primary ps-btn-sm" disabled={!!busy} onClick={convert}>
                  <Icon name="users" size={13} /> {busy === 'convert' ? 'Создаём...' : 'Создать аккаунт'}
                </button>
              )}
              {status !== 'CONVERTED' && status !== 'LOST' && (
                <button className="ps-btn ps-btn-ghost ps-btn-sm" disabled={!!busy} onClick={() => setStatus('LOST')} style={{ color: 'var(--danger)' }}>
                  Отклонить
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminRolesPage() {
  const { sideRole } = useApp()

  const [team,         setTeam]         = useState([])
  const [leads,        setLeads]        = useState([])
  const [accessMatrix, setAccessMatrix] = useState(null)
  const [leadModal,    setLeadModal]    = useState(null)

  // Load team on mount
  useEffect(() => {
    adminApi.team()
      .then(d => setTeam(Array.isArray(d) && d.length > 0 ? d : FALLBACK_TEAM))
      .catch(() => setTeam(FALLBACK_TEAM))
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
      .then(d => setAccessMatrix(d ?? FALLBACK_MATRIX))
      .catch(() => setAccessMatrix(FALLBACK_MATRIX))
  }, [])

  // Change lead status and reload (status — валидное значение enum lead_status)
  const handleLeadStatus = useCallback((id, status) => {
    adminApi.leadStatus(id, status)
      .then(() => { toast(status === 'LOST' ? 'Заявка отклонена' : 'Статус обновлён', 'success'); loadLeads() })
      .catch(e => toast(e.message || 'Не удалось обновить заявку', 'error'))
  }, [loadLeads])

  // Convert a lead into a real student account and reload
  const handleConvertLead = useCallback((id) => {
    adminApi.convertLead(id)
      .then(() => { toast('Ученик создан из заявки ✓', 'success'); loadLeads() })
      .catch(e => toast(e.message || 'Не удалось конвертировать', 'error'))
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
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{roleDescription(p)}</div>
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

              {/* Первая заявка — активная (клик → окно обработки) */}
              {firstLead && (
                <div onClick={() => setLeadModal(firstLead)} style={{ marginBottom: 12, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`ps-flag ps-flag-${firstLead.lang}`} />
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: '#fff' }}>{firstLead.name}</div>
                    <span className={`ps-chip ps-chip-${LEAD_STATUS[firstLead.status]?.chip ?? 'orange'}`} style={{ fontSize: 10 }}>
                      {LEAD_STATUS[firstLead.status]?.label ?? 'Новая'}
                    </span>
                  </div>
                  {firstLead.phone && <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>📞 {firstLead.phone}</div>}
                  {firstLead.details && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{firstLead.details}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{firstLead.receivedAt}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Обработать →</span>
                  </div>
                </div>
              )}

              {/* Остальные заявки */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leads.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Нет заявок</div>
                )}
                {restLeads.map((l, i) => (
                  <div key={l.id ?? i} onClick={() => setLeadModal(l)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                    <span className={`ps-flag ps-flag-${l.lang}`} />
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <b>{l.name}</b>{l.phone ? <span style={{ opacity: 0.85 }}> · {l.phone}</span> : (l.details ? <span style={{ opacity: 0.8 }}> · {l.details}</span> : null)}
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{l.receivedAt}</span>
                    <span className={`ps-chip ps-chip-${LEAD_STATUS[l.status]?.chip ?? 'orange'}`} style={{ fontSize: 10 }}>
                      {LEAD_STATUS[l.status]?.label ?? 'Новая'}
                    </span>
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

      {leadModal && (
        <LeadModal
          lead={leadModal}
          onClose={() => setLeadModal(null)}
          onChanged={loadLeads}
        />
      )}
    </div>
  )
}
