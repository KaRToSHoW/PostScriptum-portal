import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { teamApi } from '../api/team'
import ApiError from '../components/ApiError'

const TEACHERS = []

const LEADS = []

const ROLE_MATRIX = []

/* ── Ячейка доступа ─────────────────────────────────────────── */
function Access({ v }) {
  if (v === 'rw') return <span className="ps-chip ps-chip-green"  style={{ fontSize: 10 }}>✓ R/W</span>
  if (v === 'r')  return <span className="ps-chip ps-chip-purple" style={{ fontSize: 10 }}>R</span>
  return <span style={{ color: 'var(--ink-dim)', fontWeight: 800 }}>—</span>
}

/* ================================================================
   СТРАНИЦА РОЛИ И НАГРУЗКА
   ================================================================ */
export default function AdminRolesPage() {
  const { sideRole } = useApp()
  // data.team и data.leads заменят TEACHERS/LEADS когда бэкенд готов
  const { error } = useApi(() => teamApi.getTeam())

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Роли и распределение нагрузки" />

        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {error && <ApiError message={error} />}

          {/* Матрица доступа + Список сотрудников */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22 }}>

            {/* Матрица ролей */}
            <div className="ps-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span className="ps-eyebrow">матрица доступа</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Роли и права</h3>
                </div>
                <button className="ps-btn ps-btn-primary ps-btn-sm"><Icon name="plus" size={12} /> Новая роль</button>
              </div>
              <table className="ps-table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th>Раздел</th>
                    <th style={{ textAlign: 'center' }}>Ученик</th>
                    <th style={{ textAlign: 'center' }}>Родитель</th>
                    <th style={{ textAlign: 'center' }}>Препод.</th>
                    <th style={{ textAlign: 'center' }}>Менеджер</th>
                    <th style={{ textAlign: 'center' }}>Админ</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_MATRIX.map((row, i) => (
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
                  <span className="ps-eyebrow">команда · 38 человек</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Кто чем занимается</h3>
                </div>
              </div>

              {/* Фильтры */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  { l: 'Все', n: 38, a: true }, { l: 'Преподаватели', n: 24 },
                  { l: 'Менеджеры', n: 4 }, { l: 'Админы', n: 2 }, { l: 'Родители', n: 8 },
                ].map(f => (
                  <span key={f.l} style={{
                    padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    background: f.a ? 'var(--purple)' : 'var(--bg-cream-soft)',
                    color:      f.a ? '#fff' : 'var(--ink-muted)',
                  }}>{f.l} · {f.n}</span>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TEACHERS.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-soft)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {p.n.split(' ').map(s => s[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{p.n}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{p.r}</div>
                    </div>
                    {p.flag && <span className={`ps-flag ps-flag-${p.flag}`} style={{ width: 18, height: 18 }} />}
                    <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 700, width: 80, textAlign: 'right' }}>{p.load}</div>
                    <span className={`ps-chip ps-chip-${p.chip}`}>{p.r.split(' ')[0]}</span>
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
                  <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>заявки · 7 новых</span>
                  <h3 className="ps-display ps-display-purple" style={{ fontSize: 22, margin: '4px 0 0' }}>Распределить ученика</h3>
                </div>
                <button className="ps-btn ps-btn-primary ps-btn-sm">Все заявки</button>
              </div>

              {/* Первая заявка — активная */}

              {/* Остальные заявки */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LEADS.slice(1).map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }}>
                    <span className={`ps-flag ps-flag-${l.lang}`} />
                    <div style={{ flex: 1, fontSize: 12 }}><b>{l.n}</b> · <span style={{ opacity: 0.8 }}>{l.x}</span></div>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{l.t}</span>
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

              {TEACHERS.map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px repeat(7, 1fr) 70px', gap: 6, padding: '8px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t.flag
                      ? <span className={`ps-flag ps-flag-${t.flag}`} style={{ width: 18, height: 18 }} />
                      : <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--info-soft)', display: 'inline-block', flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 12, fontWeight: 800 }}>{t.n.split(' ')[0]} {t.n.split(' ')[1]?.[0]}.</span>
                  </div>
                  {t.h.map((v, di) => {
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
                    {Math.round(t.total / t.cap * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
