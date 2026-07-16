import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'
import SlideTabs from '../components/SlideTabs'

function KpiCard({ icon, label, value, color }) {
  return (
    <div className="ps-kpi">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: color ?? 'var(--purple-deep)' }}>
        <Icon name={icon} size={16} />
        <div className="label">{label}</div>
      </div>
      <div className="val">{value}</div>
    </div>
  )
}

function AttendanceBar({ pct, color = 'var(--purple)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 7, background: 'var(--purple-soft)', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', width: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

export default function AdminReportsPage() {
  const { sideRole } = useApp()

  const [reportPeriod, setReportPeriod] = useState(0)
  const [monthly,      setMonthly]      = useState([])
  const [teachers,     setTeachers]     = useState([])
  const [loading,      setLoading]      = useState(false)

  const PERIODS       = ['Полугодие', 'Квартал', 'Месяц']
  const PERIOD_MONTHS = [6, 3, 1]

  const loadReports = useCallback((periodIdx) => {
    setLoading(true)
    adminApi.reports(PERIOD_MONTHS[periodIdx])
      .then(data => {
        setMonthly(Array.isArray(data.monthly) ? data.monthly : [])
        setTeachers(Array.isArray(data.teachers) ? data.teachers : [])
      })
      .catch(() => {
        setMonthly([])
        setTeachers([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadReports(reportPeriod) }, [reportPeriod, loadReports])

  const totLessons  = monthly.reduce((s, m) => s + (m.lessons    ?? 0), 0)
  const avgAttend   = monthly.length > 0 ? Math.round(monthly.reduce((s, m) => s + (m.attendance ?? 0), 0) / monthly.length) : 0
  const totRevenue  = monthly.reduce((s, m) => s + (m.revenue    ?? 0), 0)
  const totStudents = monthly.reduce((s, m) => s + (m.newStudents ?? 0), 0)

  function exportCsv() {
    const header = ['Месяц', 'Уроков', 'Посещаемость %', 'Выручка', 'Новые ученики']
    const lines = [header.join(';'), ...monthly.map(m =>
      [m.month, m.lessons, m.attendance, m.revenue, m.newStudents].join(';')
    )]
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Отчёты и аналитика" />

        <div className="ps-m-pad" style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 22, opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}>

          {/* Шапка с периодом */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <SlideTabs value={reportPeriod} onChange={setReportPeriod} tabs={PERIODS.map((t, i) => ({ id: i, label: t }))} />
            <div style={{ flex: 1 }} />
            <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={exportCsv} disabled={monthly.length === 0}>
              <Icon name="download" size={12} /> Экспорт CSV
            </button>
          </div>

          {/* KPI */}
          <div className="ps-m-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard icon="calendar"  label="Проведено уроков"   value={totLessons}                             color="var(--purple-deep)" />
            <KpiCard icon="check"     label="Посещаемость"       value={`${avgAttend}%`}                        color="var(--success)"     />
            <KpiCard icon="wallet"    label="Выручка"            value={`₽ ${totRevenue.toLocaleString('ru')}`} color="var(--orange-deep)" />
            <KpiCard icon="users"     label="Новых учеников"     value={totStudents}                            color="var(--info)"        />
          </div>

          {/* Помесячная таблица */}
          <div className="ps-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-soft)' }}>
              <span className="ps-eyebrow">динамика</span>
              <h3 className="ps-display" style={{ fontSize: 20, margin: '4px 0 0' }}>Сводка по месяцам</h3>
            </div>
            <div className="ps-tablewrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Месяц</th>
                  <th style={{ textAlign: 'right' }}>Уроков</th>
                  <th>Посещаемость</th>
                  <th style={{ textAlign: 'right' }}>Выручка</th>
                  <th style={{ textAlign: 'right' }}>Новых</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '28px 0' }}>
                      {loading ? 'Загрузка…' : 'Нет данных за период'}
                    </td>
                  </tr>
                )}
                {monthly.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 800 }}>{m.month}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{m.lessons}</td>
                    <td style={{ width: 160 }}>
                      <AttendanceBar pct={m.attendance}
                        color={m.attendance >= 90 ? 'var(--success)' : m.attendance >= 80 ? 'var(--orange)' : 'var(--danger)'}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>
                      ₽ {(m.revenue ?? 0).toLocaleString('ru')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="ps-chip ps-chip-green" style={{ fontSize: 11 }}>+{m.newStudents}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Преподаватели */}
          <div className="ps-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-soft)' }}>
              <span className="ps-eyebrow">эффективность</span>
              <h3 className="ps-display" style={{ fontSize: 20, margin: '4px 0 0' }}>Отчёт по преподавателям</h3>
            </div>
            <div className="ps-tablewrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Преподаватель</th>
                  <th style={{ textAlign: 'right' }}>Уроков</th>
                  <th>Посещаемость</th>
                  <th style={{ textAlign: 'right' }}>Рейтинг</th>
                  <th style={{ textAlign: 'right' }}>Учеников</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '28px 0' }}>
                      {loading ? 'Загрузка…' : 'Нет данных'}
                    </td>
                  </tr>
                )}
                {teachers.map((t, i) => {
                  const attPct = (t.lessons ?? 0) > 0 ? Math.round((t.attended ?? 0) / t.lessons * 100) : 0
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                            {(t.name ?? '').split(' ').map(s => s[0]).join('').slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 800 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{t.lessons}</td>
                      <td style={{ width: 140 }}>
                        <AttendanceBar pct={attPct}
                          color={attPct >= 90 ? 'var(--success)' : attPct >= 80 ? 'var(--orange)' : 'var(--danger)'}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: 'var(--orange-deep)' }}>★ {t.rating}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="ps-chip ps-chip-purple">{t.students}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
