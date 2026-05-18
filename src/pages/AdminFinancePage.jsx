import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { financeApi } from '../api/finance'
import ApiError from '../components/ApiError'

/* ── Стековый бар-чарт выручки ─────────────────────────────── */
function RevenueChart() {
  const COLORS = ['var(--purple)', 'var(--orange)', '#9DC4A2', '#D7A87E', '#C9A0DC']
  const LANGS  = ['Французский', 'Английский', 'Немецкий', 'Испанский', 'Итальянский']
  const MONTHS = [
    { m: 'ЯНВ',  v: [40,30,12,8,5]  },
    { m: 'ФЕВ',  v: [48,32,13,8,6]  },
    { m: 'МАР',  v: [55,36,15,10,7] },
    { m: 'АПР',  v: [60,40,16,11,8] },
    { m: 'МАЙ',  v: [72,46,18,13,10], current: true },
    { m: 'ИЮН',  v: [25,16,7,4,3],  forecast: true },
  ]
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
        {MONTHS.map((mo, i) => {
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
function SubsDonut() {
  const TIERS = [
    { l: '8 занятий',    n: 103, p: 56, c: 'var(--purple)', price: '₽ 16 000' },
    { l: '4 занятия',    n: 52,  p: 28, c: 'var(--orange)', price: '₽ 8 000'  },
    { l: 'Speaking club',n: 20,  p: 11, c: '#9DC4A2',       price: '₽ 4 800'  },
    { l: 'Разовое',      n: 9,   p: 5,  c: '#D7A87E',       price: '₽ 2 000'  },
  ]

  return (
    <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 340 }}>
      <span className="ps-eyebrow">тарифы</span>
      <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 16px' }}>Структура абонементов</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
        {/* SVG-пончик */}
        <svg width={150} height={150} viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--purple)" strokeWidth="6" strokeDasharray="56 100" strokeDashoffset="0" />
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--orange)" strokeWidth="6" strokeDasharray="28 100" strokeDashoffset="-56" />
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#9DC4A2"       strokeWidth="6" strokeDasharray="11 100" strokeDashoffset="-84" />
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#D7A87E"       strokeWidth="6" strokeDasharray="5 100"  strokeDashoffset="-95" />
          <text x="21" y="20" textAnchor="middle" fontSize="6"   fontWeight="800" fill="var(--ink)"      fontFamily="var(--font-display)">184</text>
          <text x="21" y="25" textAnchor="middle" fontSize="2.4" fontWeight="700" fill="var(--ink-muted)">абонементов</text>
        </svg>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
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

      <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>
          Истекают на этой неделе
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Анна С.', 'Игорь П.', 'Лиза К.', 'Мила О.', '+ 5'].map((n, i) => (
            <span key={i} className="ps-chip ps-chip-orange">{n}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Таблица оплат ─────────────────────────────────────────── */
function PaymentsTable() {
  const rows = [
    { n: 'Анна Соколова',  t: '8 занятий',     l: 'fr', a: '₽ 16 000', m: 'СБП',     d: '12 мая', s: 'Оплачено',  c: 'green'  },
    { n: 'Михаил Орлов',   t: '8 занятий',     l: 'en', a: '₽ 16 000', m: 'Карта',   d: '11 мая', s: 'Оплачено',  c: 'green'  },
    { n: 'Лиза Кравцова',  t: '4 занятия',     l: 'fr', a: '₽ 8 000',  m: 'СБП',     d: '11 мая', s: 'Ожидает',   c: 'orange' },
    { n: 'Кирилл Васин',   t: 'Разовое',       l: 'fr', a: '₽ 2 000',  m: 'Карта',   d: '10 мая', s: 'Оплачено',  c: 'green'  },
    { n: 'Игорь Петров',   t: 'Speaking club', l: 'en', a: '₽ 4 800',  m: 'Перевод', d: '08 мая', s: 'Просрочено', c: 'red'    },
    { n: 'Денис Орехов',   t: '4 занятия',     l: 'de', a: '₽ 8 000',  m: 'СБП',     d: '07 мая', s: 'Оплачено',  c: 'green'  },
    { n: 'Лаура Мартин',   t: '8 занятий',     l: 'es', a: '₽ 16 000', m: 'Карта',   d: '06 мая', s: 'Оплачено',  c: 'green'  },
  ]

  return (
    <div className="ps-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-soft)' }}>
        <div>
          <span className="ps-eyebrow">последние операции</span>
          <h3 className="ps-display" style={{ fontSize: 18, margin: '4px 0 0' }}>Оплаты и абонементы</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="ps-chip ps-chip-purple">Все · 32</span>
          <span className="ps-chip ps-chip-green">Оплачено · 28</span>
          <span className="ps-chip ps-chip-orange">Ожидает · 3</span>
          <span className="ps-chip ps-chip-red">Просрочено · 1</span>
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
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 800 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                    {row.n.split(' ').map(s => s[0]).join('')}
                  </div>
                  {row.n}
                </div>
              </td>
              <td>{row.t}</td>
              <td><span className={`ps-flag ps-flag-${row.l}`} /></td>
              <td style={{ fontWeight: 800, fontFamily: 'var(--font-display)' }}>{row.a}</td>
              <td style={{ color: 'var(--ink-muted)' }}>{row.m}</td>
              <td style={{ color: 'var(--ink-muted)' }}>{row.d}</td>
              <td><span className={`ps-chip ps-chip-${row.c}`}>{row.s}</span></td>
              <td style={{ textAlign: 'right', color: 'var(--ink-muted)', cursor: 'pointer' }}>···</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ================================================================
   СТРАНИЦА ФИНАНСОВ
   ================================================================ */
const PERIOD_KEYS = ['WEEK', 'MONTH', 'QUARTER', 'YEAR']

// Заглушка — удалить когда Java API будет готов
const KPI_MOCK = [
  { l: 'Выручка · май',        v: '₽ 642 500', d: '+18% к апрелю', up: true  },
  { l: 'Активных абонементов', v: '184',        d: '+22 за месяц',  up: true  },
  { l: 'Средний чек',          v: '₽ 13 800',   d: '+₽ 400',        up: true  },
  { l: 'Просрочки',            v: '7',          d: '₽ 96 800',      up: false },
  { l: 'Возвраты',             v: '2',          d: '−1 к апрелю',   up: true  },
]

export default function AdminFinancePage() {
  const { sideRole } = useApp()
  const [period, setPeriod] = useState(1) // 0=7дн, 1=Месяц, 2=Квартал, 3=Год
  const PERIODS = ['7 дней', 'Месяц', 'Квартал', 'Год']

  // Подключение к API — data.kpi заменит KPI_MOCK когда бэкенд готов
  const { data, loading, error } = useApi(
    () => financeApi.getSummary(PERIOD_KEYS[period]),
    [period],
  )

  const KPI = data?.kpi ?? KPI_MOCK

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
            <button className="ps-btn ps-btn-outline ps-btn-sm"><Icon name="download" size={12} /> Экспорт</button>
            <button className="ps-btn ps-btn-primary ps-btn-sm"><Icon name="plus" size={12} /> Новый абонемент</button>
          </div>

          {/* KPI */}
          {error && <ApiError message={error} />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
            {KPI.map((k, i) => (
              <div key={i} className="ps-kpi">
                <div className="label">{k.l}</div>
                <div className="val" style={{ fontSize: 24 }}>{k.v}</div>
                <div className={`delta ${k.up ? 'up' : 'down'}`}>{k.up ? '↑' : '↓'} {k.d}</div>
              </div>
            ))}
          </div>

          {/* Графики */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
            <RevenueChart />
            <SubsDonut />
          </div>

          {/* Таблица */}
          <PaymentsTable />
        </div>
      </main>
    </div>
  )
}
