import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'
import { subscriptionsApi } from '../api/subscriptions'
import { toast } from '../components/Toast'

/* ── Стековый бар-чарт выручки ─────────────────────────────── */
function RevenueChart({ months }) {
  const COLORS = ['var(--purple)', 'var(--orange)', '#9DC4A2', '#D7A87E', '#C9A0DC']
  const LANGS  = ['Французский', 'Английский', 'Немецкий', 'Испанский', 'Итальянский']
  const MAX = 165

  return (
    <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 340 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <span className="ps-eyebrow">помесячная динамика</span>
          <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Выручка по языкам</h3>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', flexWrap: 'wrap' }}>
          {LANGS.map((l, i) => (
            <span key={l} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i] }} /> {l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flex: 1, minHeight: 0 }}>
        {months.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
            Нет данных
          </div>
        )}
        {months.map((mo, i) => {
          const total = mo.v.reduce((a, b) => a + b, 0)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: mo.current ? 'var(--purple-deep)' : 'var(--ink-muted)' }}>
                ₽{total}k
              </div>
              <div style={{
                width: '100%', height: `${total / MAX * 100}%`,
                display: 'flex', flexDirection: 'column-reverse',
                borderRadius: '8px 8px 4px 4px', overflow: 'hidden',
                opacity: mo.forecast ? 0.45 : 1,
                border: mo.forecast ? '1.5px dashed var(--border)' : 'none',
              }}>
                {mo.v.map((seg, si) => (
                  <div key={si} style={{ height: `${seg / total * 100}%`, background: COLORS[si] }} />
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color: mo.current ? 'var(--purple-deep)' : 'var(--ink-muted)' }}>
                {mo.m}{mo.forecast ? ' *' : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Пончик структуры абонементов ──────────────────────────── */
function SubsDonut({ subscriptions }) {
  const COLORS = ['var(--purple)', 'var(--orange)', '#9DC4A2', '#D7A87E']
  const labels = subscriptions?.labels ?? []
  const counts = subscriptions?.counts ?? []
  const active = subscriptions?.active ?? 0

  // Build tiers array from labels/counts
  const TIERS = labels.map((label, i) => ({
    l: label,
    n: counts[i] ?? 0,
    c: COLORS[i % COLORS.length],
    price: '',
  }))

  // Compute donut segments
  const total = counts.reduce((a, b) => a + b, 0) || 1
  let offset = 0
  const segments = TIERS.map((t) => {
    const pct = (t.n / total) * 100
    const seg = { ...t, pct, offset }
    offset += pct
    return seg
  })

  return (
    <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 340 }}>
      <span className="ps-eyebrow">тарифы</span>
      <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 16px' }}>Структура абонементов</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
        {/* SVG-пончик */}
        <svg width={150} height={150} viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
          {segments.map((s, i) => (
            <circle key={i} cx="21" cy="21" r="15.9" fill="none" stroke={s.c} strokeWidth="6"
              strokeDasharray={`${s.pct} 100`} strokeDashoffset={`${-s.offset}`} />
          ))}
          <text x="21" y="20" textAnchor="middle" fontSize="6"   fontWeight="800" fill="var(--ink)"      fontFamily="var(--font-display)">{active}</text>
          <text x="21" y="25" textAnchor="middle" fontSize="2.4" fontWeight="700" fill="var(--ink-muted)">абонементов</text>
        </svg>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.length === 0 && (
            <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Нет данных</div>
          )}
          {TIERS.map(t => (
            <div key={t.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: t.c, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', flex: 1 }}>{t.l}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{t.price}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.c, width: 36, textAlign: 'right' }}>{t.n}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

/* ── Статус оплаты → цвет чипа ─────────────────────────────── */
function statusChip(status) {
  switch ((status || '').toLowerCase()) {
    case 'paid':     return { cls: 'ps-chip-green',  label: 'Оплачено' }
    case 'overdue':  return { cls: 'ps-chip-red',    label: 'Просрочено' }
    case 'refunded': return { cls: 'ps-chip-purple', label: 'Возврат' }
    case 'pending':  return { cls: 'ps-chip-orange', label: 'Ожидает' }
    default:         return { cls: 'ps-chip-gray',   label: status || '—' }
  }
}

/* ── Таблица оплат ─────────────────────────────────────────── */
function PaymentsTable({ rows, total }) {
  const paid     = rows.filter(r => r.status === 'paid').length
  const pending  = rows.filter(r => r.status === 'pending').length
  const overdue  = rows.filter(r => r.status === 'overdue').length

  return (
    <div className="ps-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-soft)' }}>
        <div>
          <span className="ps-eyebrow">последние операции</span>
          <h3 className="ps-display" style={{ fontSize: 18, margin: '4px 0 0' }}>Оплаты и абонементы</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="ps-chip ps-chip-purple">Все · {total}</span>
          <span className="ps-chip ps-chip-green">Оплачено · {paid}</span>
          <span className="ps-chip ps-chip-orange">Ожидает · {pending}</span>
          <span className="ps-chip ps-chip-red">Просрочено · {overdue}</span>
        </div>
      </div>
      <table className="ps-table">
        <thead>
          <tr>
            <th>Ученик</th><th>Тариф</th><th>Язык</th>
            <th>Сумма</th><th>Метод</th><th>Дата</th>
            <th>Статус</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '24px 0' }}>
                Нет данных
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const name = row.student || '—'
            const chip = statusChip(row.status)
            return (
              <tr key={row.id}>
                <td style={{ fontWeight: 800 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                      {name.split(' ').map(s => s[0]).join('').slice(0, 2)}
                    </div>
                    {name}
                  </div>
                </td>
                <td>{row.subscription || '—'}</td>
                <td><span style={{ color: 'var(--ink-muted)' }}>—</span></td>
                <td style={{ fontWeight: 800, fontFamily: 'var(--font-display)' }}>{row.amount}</td>
                <td style={{ color: 'var(--ink-muted)' }}>{row.method || '—'}</td>
                <td style={{ color: 'var(--ink-muted)' }}>{row.date || '—'}</td>
                <td><span className={`ps-chip ${chip.cls}`}>{chip.label}</span></td>
                <td style={{ textAlign: 'right', color: 'var(--ink-muted)', cursor: 'pointer' }}>···</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Модалка нового абонемента ─────────────────────────────── */
function NewSubscriptionModal({ onClose, onCreated }) {
  const [students, setStudents] = useState([])
  const [plans, setPlans]       = useState([])
  const [studentId, setStudentId] = useState('')
  const [planId, setPlanId]       = useState('')
  const [saving, setSaving]       = useState(false)

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
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.email ? ` (${s.email})` : ''}</option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-muted)' }}>Тариф
          <select className="ps-input" style={{ width: '100%', marginTop: 4 }} value={planId} onChange={e => setPlanId(e.target.value)}>
            <option value="">Выберите тариф</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name} · {p.langName} · ₽ {Number(p.price).toLocaleString('ru-RU')}</option>
            ))}
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

function exportPaymentsCsv(rows) {
  const header = ['Ученик', 'Тариф', 'Сумма', 'Метод', 'Дата', 'Статус']
  const lines = [header.join(';')]
  rows.forEach(r => {
    lines.push([r.student, r.subscription, r.amount, r.method, r.date, r.status].map(v => `"${v ?? ''}"`).join(';'))
  })
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ================================================================
   СТРАНИЦА ФИНАНСОВ
   ================================================================ */
const PERIOD_KEYS = ['WEEK', 'MONTH', 'QUARTER', 'YEAR']

export default function AdminFinancePage() {
  const { sideRole } = useApp()
  const [period, setPeriod] = useState(1) // 0=7дн, 1=Месяц, 2=Квартал, 3=Год
  const PERIODS = ['7 дней', 'Месяц', 'Квартал', 'Год']

  const [financeData,  setFinanceData]  = useState(null)
  const [paymentsData, setPaymentsData] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [showNewSub,   setShowNewSub]   = useState(false)

  const reloadPayments = () => adminApi.payments().then(d => setPaymentsData(d)).catch(() => {})

  // Load finance when period changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminApi.finance(PERIOD_KEYS[period])
      .then(d => { if (!cancelled) setFinanceData(d) })
      .catch(() => { /* silent — render empty */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [period])

  // Load payments once on mount
  useEffect(() => {
    adminApi.payments()
      .then(d => setPaymentsData(d))
      .catch(() => { /* silent */ })
  }, [])

  const kpi          = financeData?.kpi          ?? []
  const revenueRows  = financeData?.revenue       ?? []
  const subscriptions = financeData?.subscriptions ?? null
  const paymentRows  = paymentsData?.content      ?? []
  const paymentTotal = paymentsData?.totalElements ?? 0

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Финансы и абонементы" />

        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Фильтры */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', padding: 4, background: '#fff', borderRadius: 999, border: '1px solid var(--border-soft)' }}>
              {PERIODS.map((t, i) => (
                <button key={t} onClick={() => setPeriod(i)} style={{
                  padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: period === i ? 'var(--purple)' : 'transparent',
                  color:      period === i ? '#fff' : 'var(--ink-muted)',
                  transition: 'background .12s, color .12s',
                }}>{t}</button>
              ))}
            </div>
            <span className="ps-chip ps-chip-gray" style={{ cursor: 'pointer' }}>Все языки</span>
            <span className="ps-chip ps-chip-gray" style={{ cursor: 'pointer' }}>Все преподаватели</span>
            <div style={{ flex: 1 }} />
            <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={() => exportPaymentsCsv(paymentRows)}><Icon name="download" size={12} /> Экспорт</button>
            <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setShowNewSub(true)}><Icon name="plus" size={12} /> Новый абонемент</button>
          </div>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
            {kpi.length === 0 && !loading && (
              <div style={{ gridColumn: '1/-1', color: 'var(--ink-muted)', fontSize: 13, padding: '12px 0' }}>
                Нет данных KPI
              </div>
            )}
            {kpi.map((k, i) => (
              <div key={i} className="ps-kpi">
                <div className="label">{k.l}</div>
                <div className="val" style={{ fontSize: 24 }}>{k.v}</div>
                <div className={`delta ${k.up ? 'up' : 'down'}`}>{k.up ? '↑' : '↓'} {k.d}</div>
              </div>
            ))}
          </div>

          {/* Графики */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
            <RevenueChart months={revenueRows} />
            <SubsDonut subscriptions={subscriptions} />
          </div>

          {/* Таблица */}
          <PaymentsTable rows={paymentRows} total={paymentTotal} />
        </div>
      </main>

      {showNewSub && (
        <NewSubscriptionModal
          onClose={() => setShowNewSub(false)}
          onCreated={() => { reloadPayments(); adminApi.finance(PERIOD_KEYS[period]).then(d => setFinanceData(d)).catch(() => {}) }}
        />
      )}
    </div>
  )
}
