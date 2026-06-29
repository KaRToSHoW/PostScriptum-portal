import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { teachersApi } from '../api/teachers'

const STATUS_CHIP = {
  DONE:        { cls: 'ps-chip-green',  label: 'Проведён' },
  PLANNED:     { cls: 'ps-chip-purple', label: 'Запланирован' },
  IN_PROGRESS: { cls: 'ps-chip-orange', label: 'Идёт' },
  MISSED:      { cls: 'ps-chip-red',    label: 'Пропущен' },
  CANCELLED:   { cls: 'ps-chip-gray',   label: 'Отменён' },
}

const PERIOD_KEYS = ['WEEK', 'MONTH', 'QUARTER', 'YEAR']
const PERIODS     = ['7 дней', 'Месяц', 'Квартал', 'Год']

export default function TeacherEarningsPage() {
  const { sideRole } = useApp()
  const [period, setPeriod] = useState(1)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    teachersApi.earnings(PERIOD_KEYS[period])
      .then(d => { if (!cancelled) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [period])

  const kpi     = data?.kpi ?? []
  const lessons = data?.lessons ?? []

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Доход" />

        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
            {kpi.length === 0 && !loading && (
              <div style={{ gridColumn: '1/-1', color: 'var(--ink-muted)', fontSize: 13, padding: '12px 0' }}>
                Нет данных за период
              </div>
            )}
            {kpi.map((k, i) => (
              <div key={i} className="ps-kpi">
                <div className="label">{k.l}</div>
                <div className="val" style={{ fontSize: 24 }}>{k.v}</div>
                <div className="delta">{k.d}</div>
              </div>
            ))}
          </div>

          <div className="ps-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-soft)' }}>
              <span className="ps-eyebrow">детализация</span>
              <h3 className="ps-display" style={{ fontSize: 18, margin: '4px 0 0' }}>Уроки за период</h3>
            </div>
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Дата</th><th>Язык</th><th>Ученики</th><th>Статус</th><th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {lessons.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '24px 0' }}>
                      Нет уроков за выбранный период
                    </td>
                  </tr>
                )}
                {lessons.map(l => {
                  const chip = STATUS_CHIP[l.status] ?? { cls: 'ps-chip-gray', label: l.status }
                  return (
                    <tr key={l.id}>
                      <td style={{ color: 'var(--ink-muted)' }}>{l.date}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`ps-flag ps-flag-${l.lang}`} /> {l.langName}
                        </span>
                      </td>
                      <td>{l.students || '—'}</td>
                      <td><span className={`ps-chip ${chip.cls}`}>{chip.label}</span></td>
                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                        {l.amount > 0 ? `₽ ${Number(l.amount).toLocaleString('ru-RU')}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
