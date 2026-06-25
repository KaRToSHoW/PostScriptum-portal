import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'
import { subscriptionsApi } from '../api/subscriptions'
import { toast } from '../components/Toast'

const LANG_COLORS = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--info)', es: 'var(--success)' }
const LANG_SOFT   = { fr: 'var(--purple-soft)', en: 'var(--orange-soft)', de: 'var(--info-soft)', es: 'var(--success-soft)' }

const FALLBACK_SUBS = [
  { id: 1, student: 'Анна Соколова',    lang: 'fr', langName: 'Французский', plan: '8 уроков',  used: 3,  total: 8,  status: 'ACTIVE',   expires: '15.07.2026', daysLeft: 20, price: '₽ 14 400' },
  { id: 2, student: 'Иван Петров',      lang: 'en', langName: 'Английский',  plan: '16 уроков', used: 10, total: 16, status: 'ACTIVE',   expires: '22.07.2026', daysLeft: 27, price: '₽ 24 000' },
  { id: 3, student: 'Мария Козлова',    lang: 'de', langName: 'Немецкий',    plan: '4 урока',   used: 4,  total: 4,  status: 'EXPIRED',  expires: '01.06.2026', daysLeft: 0,  price: '₽ 8 400'  },
  { id: 4, student: 'Сергей Волков',    lang: 'es', langName: 'Испанский',   plan: '8 уроков',  used: 1,  total: 8,  status: 'ACTIVE',   expires: '10.07.2026', daysLeft: 15, price: '₽ 13 000' },
  { id: 5, student: 'Ольга Смирнова',   lang: 'fr', langName: 'Французский', plan: '4 урока',   used: 4,  total: 4,  status: 'EXPIRED',  expires: '20.05.2026', daysLeft: 0,  price: '₽ 8 000'  },
  { id: 6, student: 'Дмитрий Фролов',   lang: 'en', langName: 'Английский',  plan: '8 уроков',  used: 6,  total: 8,  status: 'ACTIVE',   expires: '05.08.2026', daysLeft: 41, price: '₽ 13 600' },
]

function statusChip(status) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':   return { cls: 'ps-chip-green',  label: 'Активный'  }
    case 'EXPIRED':  return { cls: 'ps-chip-gray',   label: 'Истёк'     }
    case 'PENDING':  return { cls: 'ps-chip-orange', label: 'Ожидает'   }
    case 'CANCELLED':return { cls: 'ps-chip-red',    label: 'Отменён'   }
    default:         return { cls: 'ps-chip-gray',   label: status || '—' }
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
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} · {p.langName} · ₽ {Number(p.price).toLocaleString('ru-RU')}</option>)}
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

  const [subs,       setSubs]       = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLang,   setFilterLang]   = useState('all')
  const [search,       setSearch]       = useState('')
  const [showNew,      setShowNew]      = useState(false)

  const load = () => {
    subscriptionsApi.list()
      .then(data => setSubs(Array.isArray(data) && data.length > 0 ? data.map(s => ({
        id: s.id,
        student: s.studentName ?? s.student ?? '—',
        lang: s.lang,
        langName: s.langName,
        plan: `${s.total} уроков`,
        used: s.used, total: s.total,
        status: s.status,
        expires: s.endDate ? new Date(s.endDate).toLocaleDateString('ru-RU') : '—',
        daysLeft: s.daysLeft ?? 0,
        price: `₽ ${Number(s.price ?? 0).toLocaleString('ru-RU')}`,
      })) : FALLBACK_SUBS))
      .catch(() => setSubs(FALLBACK_SUBS))
  }

  useEffect(() => { load() }, [])

  const active  = subs.filter(s => s.status === 'ACTIVE').length
  const expired = subs.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED').length
  const urgent  = subs.filter(s => s.status === 'ACTIVE' && s.daysLeft <= 7).length

  const LANG_OPTIONS   = ['all', 'fr', 'en', 'de', 'es']
  const LANG_LABELS    = { all: 'Все языки', fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский' }
  const STATUS_OPTIONS = ['all', 'ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED']
  const STATUS_LABELS  = { all: 'Все статусы', ACTIVE: 'Активные', EXPIRED: 'Истёкшие', PENDING: 'Ожидают', CANCELLED: 'Отменённые' }

  const filtered = subs.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (filterLang !== 'all' && s.lang !== filterLang) return false
    if (search && !s.student.toLowerCase().includes(search.toLowerCase())) return false
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
              { l: 'Всего абонементов',  v: subs.length,  icon: 'bookmark', color: 'var(--purple-deep)' },
              { l: 'Активных',           v: active,       icon: 'check',    color: 'var(--success)'     },
              { l: 'Истёкших',           v: expired,      icon: 'warning',  color: 'var(--ink-muted)'   },
              { l: 'Истекают скоро',     v: urgent,       icon: 'warning',  color: 'var(--orange-deep)' },
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

            <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: '1px solid var(--border-soft)', background: filterLang !== 'all' ? 'var(--orange-soft)' : '#fff', color: filterLang !== 'all' ? 'var(--orange-deep)' : 'var(--ink-muted)', cursor: 'pointer', outline: 'none' }}>
              {LANG_OPTIONS.map(l => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
            </select>

            <div style={{ position: 'relative' }}>
              <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по ученику…"
                style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid var(--border-soft)', background: '#fff', color: 'var(--ink)', outline: 'none', width: 200 }} />
            </div>

            {(filterStatus !== 'all' || filterLang !== 'all' || search) && (
              <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => { setFilterStatus('all'); setFilterLang('all'); setSearch('') }}>
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
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="ps-eyebrow">список</span>
                <h3 className="ps-display" style={{ fontSize: 18, margin: '4px 0 0' }}>Все абонементы · {filtered.length}</h3>
              </div>
            </div>
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Язык</th>
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
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '24px 0' }}>Нет данных</td>
                  </tr>
                )}
                {filtered.map(s => {
                  const chip = statusChip(s.status)
                  const pct  = s.total > 0 ? Math.round(s.used / s.total * 100) : 0
                  const color = LANG_COLORS[s.lang] ?? 'var(--purple)'
                  const soft  = LANG_SOFT[s.lang]  ?? 'var(--purple-soft)'
                  const urgent = s.status === 'ACTIVE' && s.daysLeft <= 7
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                            {s.student.split(' ').map(x => x[0]).join('').slice(0, 2)}
                          </div>
                          {s.student}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13 }}>{s.langName}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-muted)' }}>{s.plan}</td>
                      <td style={{ minWidth: 130 }}>
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4 }}>{s.used} / {s.total} уроков</div>
                        <div style={{ height: 6, background: soft, borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
                        </div>
                      </td>
                      <td style={{ color: urgent ? 'var(--danger)' : 'var(--ink-muted)', fontWeight: urgent ? 800 : 600, fontSize: 13 }}>
                        {urgent && '⚠ '}{s.expires}
                        {s.status === 'ACTIVE' && <div style={{ fontSize: 11, color: urgent ? 'var(--danger)' : 'var(--ink-muted)' }}>через {s.daysLeft} дн.</div>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>{s.price}</td>
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
