import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const FALLBACK_MONTHLY = [
  { month: 'Январь',   lessons: 142, attendance: 91, revenue: 284000, newStudents: 8  },
  { month: 'Февраль',  lessons: 158, attendance: 94, revenue: 316000, newStudents: 11 },
  { month: 'Март',     lessons: 171, attendance: 89, revenue: 342000, newStudents: 14 },
  { month: 'Апрель',   lessons: 165, attendance: 93, revenue: 330000, newStudents: 9  },
  { month: 'Май',      lessons: 148, attendance: 88, revenue: 296000, newStudents: 7  },
  { month: 'Июнь',     lessons: 132, attendance: 90, revenue: 264000, newStudents: 6  },
]

const FALLBACK_TEACHERS = [
  { name: 'Алексей Смирнов',  lang: 'Французский, Английский', lessons: 68, attended: 64, rating: 4.9, students: 12 },
  { name: 'Мария Козлова',    lang: 'Немецкий',                 lessons: 52, attended: 50, rating: 4.8, students: 9  },
  { name: 'Екатерина Лебедева', lang: 'Испанский, Французский', lessons: 44, attended: 41, rating: 4.7, students: 7  },
  { name: 'Дмитрий Волков',   lang: 'Английский',               lessons: 38, attended: 34, rating: 4.5, students: 6  },
]

const FALLBACK_LANGS = [
  { lang: 'Французский', students: 47, revenue: 940000,  pct: 38 },
  { lang: 'Английский',  students: 39, revenue: 780000,  pct: 31 },
  { lang: 'Немецкий',    students: 21, revenue: 420000,  pct: 17 },
  { lang: 'Испанский',   students: 18, revenue: 360000,  pct: 14 },
]

const LANG_COLORS = ['var(--purple)', 'var(--orange)', '#9DC4A2', '#D7A87E']

function KpiCard({ icon, label, value, delta, up, color }) {
  return (
    <div className="ps-kpi">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: color ?? 'var(--purple-deep)' }}>
        <Icon name={icon} size={16} />
        <div className="label">{label}</div>
      </div>
      <div className="val">{value}</div>
      {delta && <div className={`delta ${up ? 'up' : 'down'}`}>{up ? '↑' : '↓'} {delta}</div>}
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
  const [monthly,      setMonthly]      = useState(FALLBACK_MONTHLY)
  const [teachers,     setTeachers]     = useState(FALLBACK_TEACHERS)
  const [langs,        setLangs]        = useState(FALLBACK_LANGS)

  const PERIODS = ['Полугодие', 'Квартал', 'Месяц']

  const displayed = reportPeriod === 2 ? monthly.slice(-1)
    : reportPeriod === 1 ? monthly.slice(-3)
    : monthly

  const totLessons  = displayed.reduce((s, m) => s + m.lessons, 0)
  const avgAttend   = Math.round(displayed.reduce((s, m) => s + m.attendance, 0) / (displayed.length || 1))
  const totRevenue  = displayed.reduce((s, m) => s + m.revenue, 0)
  const totStudents = displayed.reduce((s, m) => s + m.newStudents, 0)

  function exportCsv() {
    const header = ['Месяц', 'Уроков', 'Посещаемость %', 'Выручка', 'Новые ученики']
    const lines = [header.join(';'), ...displayed.map(m =>
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

        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Шапка с периодом */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', padding: 4, background: '#fff', borderRadius: 999, border: '1px solid var(--border-soft)' }}>
              {PERIODS.map((t, i) => (
                <button key={t} onClick={() => setReportPeriod(i)} style={{
                  padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: reportPeriod === i ? 'var(--purple)' : 'transparent',
                  color:      reportPeriod === i ? '#fff' : 'var(--ink-muted)',
                  transition: 'background .12s, color .12s',
                }}>{t}</button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={exportCsv}>
              <Icon name="download" size={12} /> Экспорт CSV
            </button>
          </div>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard icon="calendar"  label="Проведено уроков"   value={totLessons}  delta="vs прошлый период" up={true}  color="var(--purple-deep)" />
            <KpiCard icon="check"     label="Посещаемость"       value={`${avgAttend}%`} delta="средняя"      up={true}  color="var(--success)"     />
            <KpiCard icon="wallet"    label="Выручка"            value={`₽ ${totRevenue.toLocaleString('ru')}`} delta="период" up={true} color="var(--orange-deep)" />
            <KpiCard icon="users"     label="Новых учеников"     value={totStudents}  delta="за период"       up={true}  color="var(--info)"        />
          </div>

          {/* Таблица по месяцам + По языкам */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22 }}>

            {/* Помесячная таблица */}
            <div className="ps-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-soft)' }}>
                <span className="ps-eyebrow">динамика</span>
                <h3 className="ps-display" style={{ fontSize: 20, margin: '4px 0 0' }}>Сводка по месяцам</h3>
              </div>
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
                  {displayed.map((m, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800 }}>{m.month}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{m.lessons}</td>
                      <td style={{ width: 160 }}>
                        <AttendanceBar pct={m.attendance}
                          color={m.attendance >= 90 ? 'var(--success)' : m.attendance >= 80 ? 'var(--orange)' : 'var(--danger)'}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>
                        ₽ {m.revenue.toLocaleString('ru')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="ps-chip ps-chip-green" style={{ fontSize: 11 }}>+{m.newStudents}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* По языкам */}
            <div className="ps-card" style={{ padding: 24 }}>
              <span className="ps-eyebrow">распределение</span>
              <h3 className="ps-display" style={{ fontSize: 20, margin: '4px 0 20px' }}>По языкам</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {langs.map((l, i) => (
                  <div key={l.lang}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: LANG_COLORS[i], flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{l.lang}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', display: 'flex', gap: 14 }}>
                        <span>{l.students} уч.</span>
                        <span style={{ fontWeight: 800, color: 'var(--ink)' }}>₽ {l.revenue.toLocaleString('ru')}</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-cream-soft)', borderRadius: 4 }}>
                      <div style={{ width: `${l.pct}%`, height: '100%', background: LANG_COLORS[i], borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3, textAlign: 'right' }}>{l.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Преподаватели */}
          <div className="ps-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-soft)' }}>
              <span className="ps-eyebrow">эффективность</span>
              <h3 className="ps-display" style={{ fontSize: 20, margin: '4px 0 0' }}>Отчёт по преподавателям</h3>
            </div>
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Преподаватель</th>
                  <th>Языки</th>
                  <th style={{ textAlign: 'right' }}>Уроков</th>
                  <th>Посещаемость</th>
                  <th style={{ textAlign: 'right' }}>Рейтинг</th>
                  <th style={{ textAlign: 'right' }}>Учеников</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, i) => {
                  const attPct = Math.round(t.attended / t.lessons * 100)
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                            {t.name.split(' ').map(s => s[0]).join('').slice(0, 2)}
                          </div>
                          <span style={{ fontWeight: 800 }}>{t.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{t.lang}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{t.lessons}</td>
                      <td style={{ width: 140 }}>
                        <AttendanceBar pct={attPct}
                          color={attPct >= 90 ? 'var(--success)' : attPct >= 80 ? 'var(--orange)' : 'var(--danger)'}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: 'var(--orange-deep)' }}>{'★'.repeat(Math.round(t.rating))} {t.rating}</span>
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
      </main>
    </div>
  )
}
