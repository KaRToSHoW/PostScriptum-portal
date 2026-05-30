import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { dashboardApi } from '../api/dashboard'
import ApiError from '../components/ApiError'
import { toast } from '../components/Toast'

/* ── Кастомный огонёк ────────────────────────────────────── */
function FlameIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C12 3 6 10 6 15C6 18.3 8.7 21 12 21C15.3 21 18 18.3 18 15C18 10 12 3 12 3Z"
        fill="var(--orange)"
      />
      <path
        d="M12 11C12 11 10 14 10 16C10 17.1 10.9 18 12 18C13.1 18 14 17.1 14 16C14 14 12 11 12 11Z"
        fill="#FFF8E1"
        opacity="0.75"
      />
    </svg>
  )
}

/* ── Прогресс-кольцо ──────────────────────────────────────── */
function ProgressRing({ value = 65, size = 56, color = 'var(--purple)' }) {
  const r = size / 2 - 6
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--purple-soft)" strokeWidth="6" fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="6" fill="none"
        strokeDasharray={`${c*value/100} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="800" fill="var(--purple-deep)"
        fontFamily="var(--font-display)">{value}%</text>
    </svg>
  )
}

/* ── Переключатель ролей ──────────────────────────────────── */
function RoleSwitcher({ role, onChange, t }) {
  const roles = [
    { id: 'student', l: t('Ученик') },
    { id: 'teacher', l: t('Преподаватель') },
    { id: 'parent',  l: t('Родитель') },
    { id: 'admin',   l: t('Админ') },
  ]
  return (
    <div style={{
      display: 'inline-flex', padding: 4,
      background: 'var(--bg-cream)', borderRadius: 999,
      border: '1px solid var(--border)', gap: 2,
    }}>
      {roles.map(r => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          style={{
            padding: '6px 16px', borderRadius: 999,
            fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
            transition: 'background .12s, color .12s',
            background: role === r.id ? 'var(--purple)' : 'transparent',
            color:      role === r.id ? '#fff' : 'var(--ink-muted)',
          }}
        >{r.l}</button>
      ))}
    </div>
  )
}

const LANG_NAME  = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }
const LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--warning)', es: 'var(--success)', it: 'var(--info)' }

const HW_CHIP  = { not_started: 'orange', submitted: 'blue', done: 'green', overdue: 'red', ASSIGNED: 'orange', SUBMITTED: 'blue', REVIEWED: 'green', OVERDUE: 'red' }
const HW_LABEL = { not_started: 'Не начато', submitted: 'Сдано', done: 'Готово', overdue: 'Просрочено', ASSIGNED: 'Не начато', SUBMITTED: 'Сдано', REVIEWED: 'Готово', OVERDUE: 'Просрочено' }

/* ================================================================
   ДАШБОРД УЧЕНИКА
   ================================================================ */
function DashStudent({ t, data }) {
  const navigate = useNavigate()
  const next  = data?.nextLesson   ?? null
  const sub   = data?.subscription ?? { used: 0, total: 0 }
  const streak = data?.streak      ?? 0
  const courses  = data?.courses   ?? []
  const homework = data?.homework  ?? []
  const schedule = data?.schedule  ?? []
  return (
    <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
        {/* Карточка следующего урока */}
        <div className="ps-card-purple" style={{ padding: 30, position: 'relative', overflow: 'hidden', minHeight: 200 }}>
          <div className="ps-dotted" style={{ display: 'inline-block', color: '#FBE3C5', borderColor: '#FBE3C5' }}>
            {t('Ваш следующий урок')}
          </div>
          <h1 className="ps-display ps-display-purple" style={{ fontSize: 38, marginTop: 14, marginBottom: 8 }}>
            {next ? `Скоро в ${next.time}` : t('Добро пожаловать!')}
          </h1>
          {next && (
            <p style={{ fontSize: 14, opacity: 0.88, maxWidth: 460, margin: '0 0 18px', lineHeight: 1.55 }}>
              Урок с <b>{next.teacher}</b>
            </p>
          )}
          {next && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="ps-btn ps-btn-primary" onClick={() => next.zoomUrl && window.open(next.zoomUrl, '_blank')}>
                <Icon name="play" size={14} /> {t('Войти в Zoom')}
              </button>
              <button className="ps-btn" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => navigate('/homework')}>
                <Icon name="file" size={14} /> {t('Подготовиться')}
              </button>
            </div>
          )}
          <div style={{ position: 'absolute', right: -30, top: -20, fontFamily: 'var(--font-display)', fontSize: 260, color: 'rgba(255,255,255,0.07)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>{next?.lang?.toUpperCase() ?? 'PS'}</div>
        </div>

        {/* Серия + Абонемент */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 14 }}>
          <div className="ps-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--orange-soft)', display: 'grid', placeItems: 'center', color: 'var(--orange-deep)', flexShrink: 0 }}>
              <Icon name="flame" size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                количество занятий без пропусков
                <FlameIcon size={14} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 2 }}>
                {streak} дней <FlameIcon size={28} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0,1,0,1,0,1,0].map((d, i) => (
                <div key={i} style={{ width: 8, height: 22, borderRadius: 3, background: d ? 'var(--orange)' : 'var(--orange-soft)' }} />
              ))}
            </div>
          </div>
          <div className="ps-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--purple-soft)', display: 'grid', placeItems: 'center', color: 'var(--purple-deep)', flexShrink: 0 }}>
              <Icon name="wallet" size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{t('Абонемент')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>{sub.used} из {sub.total} уроков</div>
              <div style={{ height: 6, background: 'var(--purple-soft)', borderRadius: 3, marginTop: 6 }}>
                <div style={{ height: '100%', width: `${sub.total ? Math.round(sub.used/sub.total*100) : 0}%`, background: 'var(--purple)', borderRadius: 3 }} />
              </div>
            </div>
            <button className="ps-btn ps-btn-sm ps-btn-outline" style={{ flexShrink: 0 }} onClick={() => navigate('/billing')}>{t('Продлить')}</button>
          </div>
        </div>
      </div>

      {/* Курсы + Расписание */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>

        {/* Курсы + Домашка */}
        <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="ps-eyebrow">{t('мои курсы')}</span>
              <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Прогресс по языкам</h3>
            </div>
            <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => navigate('/billing')}>{t('Все курсы')} <Icon name="arrow" size={12} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {courses.length === 0 && (
              <div style={{ gridColumn:'1/-1', color:'var(--ink-muted)', fontSize:13, padding:'12px 0' }}>Нет активных курсов</div>
            )}
            {courses.map(c => {
              const color = LANG_COLOR[c.lang] || 'var(--purple)'
              return (
                <div key={c.id} style={{ padding: 16, borderRadius: 16, border: '1px solid var(--border-soft)', display: 'flex', gap: 14, alignItems: 'center', background: 'var(--bg-cream-soft)' }}>
                  <ProgressRing value={c.progress ?? 0} color={color} size={64} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{c.language}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>с {c.teacher}</div>
                    <div style={{ fontSize: 11, marginTop: 8, color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>{c.nextDate ?? '—'}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16, marginTop: 4 }}>
            <span className="ps-eyebrow">{t('домашка на эту неделю')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {homework.length === 0 && (
                <div style={{ color:'var(--ink-muted)', fontSize:13 }}>Нет заданий</div>
              )}
              {homework.map((h, i) => (
                <div key={h.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: '#fff', border: '1px solid var(--border-soft)' }}>
                  <span className={`ps-flag ps-flag-${h.lang}`} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{h.title}</div>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700, flexShrink: 0 }}>{h.due}</span>
                  <span className={`ps-chip ps-chip-${HW_CHIP[h.status] ?? 'gray'}`}>{HW_LABEL[h.status] ?? h.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Расписание */}
        <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <span className="ps-eyebrow">{t('эта неделя')}</span>
              <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>{t('Расписание')}</h3>
            </div>
            <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => navigate('/calendar')}><Icon name="calendar" size={12} /> {t('Календарь')}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {schedule.length === 0 && (
              <div style={{ color:'var(--ink-muted)', fontSize:13, paddingTop:8 }}>Нет запланированных уроков</div>
            )}
            {schedule.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-soft)', alignItems: 'center' }}>
                <div style={{
                  width: 46, textAlign: 'center', padding: '6px 0', borderRadius: 10, flexShrink: 0,
                  background: 'var(--bg-cream)', color: 'var(--ink-2)',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{it.date}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>{it.dayLabel}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 800, letterSpacing: '.08em' }}>{it.timeFrom} → {it.timeTo}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{LANG_NAME[it.lang] ?? it.lang}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 1 }}>{it.teacher}</div>
                </div>
                <span className={`ps-flag ps-flag-${it.lang}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   ДАШБОРД ПРЕПОДАВАТЕЛЯ
   ================================================================ */
function DashTeacher({ t, data }) {
  const navigate = useNavigate()
  const schedule  = data?.schedule  ?? []
  const attention = data?.attention ?? []
  const workload  = data?.workload  ?? { days: [], totalHours: 0, capacity: 0 }
  const students  = new Set(schedule.map(s => s.student)).size

  const ATTN_COLOR = { orange: 'var(--orange-soft)', red: 'var(--danger-soft)', purple: 'var(--purple-tint)', green: 'var(--success-soft)' }

  return (
    <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: t('Уроков на неделе'),    v: schedule.length,                     d: 'предстоит',     icon: 'calendar' },
          { l: t('Активных учеников'),   v: students,                            d: 'в расписании',  icon: 'users'    },
          { l: t('Часов на неделе'),     v: `${workload.totalHours} / ${workload.capacity}`, d: 'загрузка', icon: 'clock' },
          { l: t('Требует внимания'),    v: attention.length,                    d: 'событий',       icon: 'warning'  },
        ].map((k, i) => (
          <div key={i} className="ps-kpi">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--purple-deep)' }}>
              <Icon name={k.icon} size={16} />
              <div className="label">{k.l}</div>
            </div>
            <div className="val">{k.v}</div>
            <div className="delta">{k.d}</div>
          </div>
        ))}
      </div>

      {/* Расписание + колонка справа */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 22 }}>

        {/* Timeline уроков */}
        <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <span className="ps-eyebrow">ближайшие уроки</span>
              <h3 className="ps-display" style={{ fontSize: 24, margin: '4px 0 0' }}>
                {schedule.length > 0 ? `${schedule.length} уроков` : 'Нет уроков'}
              </h3>
            </div>
            <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => navigate('/calendar')}>
              <Icon name="calendar" size={12} /> {t('Календарь')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {schedule.length === 0 && (
              <div style={{ color: 'var(--ink-muted)', fontSize: 13, padding: '8px 0' }}>Запланированных уроков нет</div>
            )}
            {schedule.map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px dashed var(--border)' : 'none', alignItems: 'center' }}>
                <div style={{ width: 54, flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{s.date}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.dayLabel}</div>
                </div>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: 'var(--purple-soft)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 800, letterSpacing: '.08em' }}>{s.timeFrom} → {s.timeTo}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{s.student}</div>
                </div>
                <span className={`ps-flag ps-flag-${s.lang}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Правая колонка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Требует внимания */}
          <div className="ps-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 className="ps-display" style={{ fontSize: 18, margin: 0 }}>Требует внимания</h3>
              <span className="ps-chip ps-chip-orange">{attention.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {attention.length === 0 && (
                <div style={{ color: 'var(--ink-muted)', fontSize: 12 }}>Всё под контролем 👌</div>
              )}
              {attention.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: ATTN_COLOR[n.type] || 'var(--purple-tint)', color: 'var(--ink-2)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                    {(n.who || '?').split(' ').map(s => s[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{n.who}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{n.what}</div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 700, flexShrink: 0 }}>{n.timeAgo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Нагрузка за неделю */}
          <div className="ps-card-purple" style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>нагрузка</span>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 22, margin: '4px 0 14px' }}>На этой неделе</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {(workload.days.length ? workload.days : [0,0,0,0,0,0,0].map((_, i) => ({ label: ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'][i], pct: 0 }))).map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: `${b.pct}%`, minHeight: 3, background: b.today ? 'var(--orange)' : 'rgba(255,255,255,0.3)', borderRadius: '6px 6px 3px 3px' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: b.today ? '#fff' : 'rgba(255,255,255,0.65)' }}>{b.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)', fontSize: 12 }}>
              <span style={{ opacity: 0.7 }}>Всего часов</span>
              <span style={{ fontWeight: 800 }}>{workload.totalHours} / {workload.capacity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   СТРАНИЦА ДАШБОРДА
   ================================================================ */
const DASH_TITLE = { student: 'Главная', teacher: 'Главная', parent: 'Главная', admin: 'Дашборд' }

export default function DashboardPage() {
  const { role, setRole, sideRole, t } = useApp()

  const { data, error } = useApi(
    () => (role === 'teacher' ? dashboardApi.getTeacher() : dashboardApi.getStudent()),
    [role],
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={DASH_TITLE[role] || 'Главная'} />

        <div style={{ padding: '16px 28px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RoleSwitcher role={role} onChange={setRole} t={t} />
          {error && <ApiError message={error} />}
        </div>

        {(role === 'student' || role === 'parent') && <DashStudent t={t} data={data} />}
        {(role === 'teacher' || role === 'admin')  && <DashTeacher t={t} data={data} />}
      </main>
    </div>
  )
}
