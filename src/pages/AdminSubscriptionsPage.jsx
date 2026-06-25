import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'
import { subscriptionsApi } from '../api/subscriptions'
import { toast } from '../components/Toast'

function statusChip(status) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':    return { cls: 'ps-chip-green',  label: 'Активный'  }
    case 'EXPIRED':   return { cls: 'ps-chip-gray',   label: 'Истёк'     }
    case 'PAUSED':    return { cls: 'ps-chip-orange', label: 'Пауза'     }
    case 'CANCELLED': return { cls: 'ps-chip-red',    label: 'Отменён'   }
    default:          return { cls: 'ps-chip-gray',   label: status || '—' }
  }
}

function NewSubscriptionModal({ onClose, onCreated }) {
  const [students,  setStudents]  = useState([])
  const [plans,     setPlans]     = useState([])
  const [studentId, setStudentId] = useState('')
  const [planId,    setPlanId]    = useState('')
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    adminApi.students().then(d => setStudents(Array.isArray(d) ? d : [])).catch(() => {})
    subscriptionsApi.plans().then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function submit() {
    if (!studentId || !planId) return
    setSaving(true)
    adminApi.createSubscription({ studentId: Number(studentId), planId: Number(planId) })
      .then(() => { toast('Абонемент оформлен ✓'); onCreated(); onClose() })
      .catch(() => toast('Не удалось оформить абонемент'))
      .finally(() => setSaving(false))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 420, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 className="ps-display" style={{ fontSize: 20, margin: 0 }}>Новый абонемент</h3>
        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-muted)' }}>Ученик
          <select className="ps-input" style={{ width: '100%', marginTop: 4 }} value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">Выберите ученика</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}{s.email ? ` (${s.email})` : ''}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-muted)' }}>Тариф
          <select className="ps-input" style={{ width: '100%', marginTop: 4 }} value={planId} onChange={e => setPlanId(e.target.value)}>
            <option value="">Выберите тариф</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} · ₽ {Number(p.price).toLocaleString('ru-RU')}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button className="ps-btn ps-btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving || !studentId || !planId} onClick={submit}>
            {saving ? 'Сохранение…' : 'Оформить'}
          </button>
          <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSubscriptionsPage() {
  const { sideRole } = useApp()

  const [subs,         setSubs]         = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [search,       setSearch]       = useState('')
  const [showNew,      setShowNew]      = useState(false)

  const load = () => {
    adminApi.allSubscriptions()
      .then(data => setSubs(Array.isArray(data) ? data : []))
      .catch(() => setSubs([]))
  }

  useEffect(() => { load() }, [])

  const active  = subs.filter(s => s.status === 'ACTIVE').length
  const expired = subs.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED').length
  const urgent  = subs.filter(s => s.status === 'ACTIVE' && (s.daysLeft ?? 99) <= 7).length

  const STATUS_OPTIONS = ['all', 'ACTIVE', 'EXPIRED', 'PAUSED', 'CANCELLED']
  const STATUS_LABELS  = { all: 'Все статусы', ACTIVE: 'Активные', EXPIRED: 'Истёкшие', PAUSED: 'На паузе', CANCELLED: 'Отменённые' }

  const filtered = subs.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (search && !(s.student ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Абонементы учеников" />

        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего абонементов', v: subs.length, icon: 'bookmark', color: 'var(--purple-deep)' },
              { l: 'Активных',          v: active,      icon: 'check',    color: 'var(--success)'     },
              { l: 'Истёкших',          v: expired,     icon: 'warning',  color: 'var(--ink-muted)'   },
              { l: 'Истекают скоро',    v: urgent,      icon: 'warning',  color: 'var(--orange-deep)' },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{k.v}</div>
              </div>
            ))}
          </div>

          {/* Фильтры */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: '1px solid var(--border-soft)', background: filterStatus !== 'all' ? 'var(--purple-soft)' : '#fff', color: filterStatus !== 'all' ? 'var(--purple-deep)' : 'var(--ink-muted)', cursor: 'pointer', outline: 'none' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

            <div style={{ position: 'relative' }}>
              <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по ученику…"
                style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid var(--border-soft)', background: '#fff', color: 'var(--ink)', outline: 'none', width: 200 }} />
            </div>

            {(filterStatus !== 'all' || search) && (
              <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => { setFilterStatus('all'); setSearch('') }}>
                Сбросить
              </button>
            )}

            <div style={{ flex: 1 }} />
            <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setShowNew(true)}>
              <Icon name="plus" size={12} /> Новый абонемент
            </button>
          </div>

          {/* Таблица */}
          <div className="ps-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-soft)' }}>
              <span className="ps-eyebrow">список</span>
              <h3 className="ps-display" style={{ fontSize: 18, margin: '4px 0 0' }}>Все абонементы · {filtered.length}</h3>
            </div>
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Тариф</th>
                  <th>Прогресс</th>
                  <th>Истекает</th>
                  <th>Цена</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '28px 0' }}>
                      {subs.length === 0 ? 'Нет абонементов' : 'Ничего не найдено'}
                    </td>
                  </tr>
                )}
                {filtered.map(s => {
                  const chip   = statusChip(s.status)
                  const pct    = (s.total ?? 0) > 0 ? Math.round((s.used ?? 0) / s.total * 100) : 0
                  const urgent = s.status === 'ACTIVE' && (s.daysLeft ?? 99) <= 7
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                            {(s.student ?? '?').split(' ').map(x => x[0]).join('').slice(0, 2)}
                          </div>
                          {s.student ?? '—'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-muted)' }}>{s.plan ?? '—'}</td>
                      <td style={{ minWidth: 130 }}>
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4 }}>{s.used ?? 0} / {s.total ?? 0} уроков</div>
                        <div style={{ height: 6, background: 'var(--purple-soft)', borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--purple)', borderRadius: 3 }} />
                        </div>
                      </td>
                      <td style={{ color: urgent ? 'var(--danger)' : 'var(--ink-muted)', fontWeight: urgent ? 800 : 600, fontSize: 13 }}>
                        {urgent && '⚠ '}{s.expires ?? '—'}
                        {s.status === 'ACTIVE' && s.daysLeft != null && (
                          <div style={{ fontSize: 11, color: urgent ? 'var(--danger)' : 'var(--ink-muted)' }}>через {s.daysLeft} дн.</div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>{s.price ?? '—'}</td>
                      <td><span className={`ps-chip ${chip.cls}`}>{chip.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      {showNew && (
        <NewSubscriptionModal
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
