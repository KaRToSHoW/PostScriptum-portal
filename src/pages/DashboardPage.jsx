import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { useApi } from '../hooks/useApi'
import { dashboardApi } from '../api/dashboard'
import ApiError from '../components/ApiError'
import { toast } from '../components/Toast'

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

/* ================================================================
   ДАШБОРД УЧЕНИКА
   ================================================================ */
function DashStudent({ t }) {
  const navigate = useNavigate()
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
            Bonjour, <span style={{ color: 'var(--orange-soft)' }}>Анна!</span>
          </h1>
          <p style={{ fontSize: 14, opacity: 0.88, maxWidth: 460, margin: 0, lineHeight: 1.55 }}>
            Сегодня в <b>18:30</b> урок с Софьей Фроловой:{' '}
            <i>«Conditionnel présent — мечтаем по-французски»</i>.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <button className="ps-btn ps-btn-primary" onClick={() => toast('Открываем Zoom... (ссылка придёт на email)', 'success')}>
              <Icon name="play" size={14} /> {t('Войти в Zoom')}
            </button>
            <button className="ps-btn" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => navigate('/homework')}>
              <Icon name="file" size={14} /> {t('Подготовиться')}
            </button>
          </div>
          <div style={{ position: 'absolute', right: -30, top: -20, fontFamily: 'var(--font-display)', fontSize: 260, color: 'rgba(255,255,255,0.07)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>FR</div>
        </div>

        {/* Серия + Абонемент */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 14 }}>
          <div className="ps-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--orange-soft)', display: 'grid', placeItems: 'center', color: 'var(--orange-deep)', flexShrink: 0 }}>
              <Icon name="flame" size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{t('Серия занятий')}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                12 дней <span style={{ fontSize: 16, color: 'var(--orange-deep)' }}>🔥</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[1,1,1,1,1,1,0].map((d, i) => (
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
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>5 из 8 уроков</div>
              <div style={{ height: 6, background: 'var(--purple-soft)', borderRadius: 3, marginTop: 6 }}>
                <div style={{ height: '100%', width: '62%', background: 'var(--purple)', borderRadius: 3 }} />
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
            {[
              { code: 'fr', name: 'Французский B1', teacher: 'Софья Ф.',  value: 72, color: 'var(--purple)', next: 'Сегодня · 18:30' },
              { code: 'en', name: 'Английский A2+', teacher: 'Татьяна К.', value: 41, color: 'var(--orange)', next: 'Чт · 19:00' },
            ].map(c => (
              <div key={c.code} style={{ padding: 16, borderRadius: 16, border: '1px solid var(--border-soft)', display: 'flex', gap: 14, alignItems: 'center', background: 'var(--bg-cream-soft)' }}>
                <ProgressRing value={c.value} color={c.color} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>с {c.teacher}</div>
                  <div style={{ fontSize: 11, marginTop: 8, color: c.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>{c.next}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16, marginTop: 4 }}>
            <span className="ps-eyebrow">{t('домашка на эту неделю')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {[
                { t: 'Эссе «Mes rêves» (200 слов)', due: 'до пт',    lang: 'fr', state: 'В работе',   color: 'purple' },
                { t: 'Listening · BBC News A2',      due: 'до ср',    lang: 'en', state: 'Не начато',  color: 'orange' },
                { t: 'Лексика модуля 4 — Quizlet',   due: 'сегодня',  lang: 'fr', state: 'Готово',     color: 'green'  },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: '#fff', border: '1px solid var(--border-soft)' }}>
                  <span className={`ps-flag ps-flag-${h.lang}`} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{h.t}</div>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700, flexShrink: 0 }}>{h.due}</span>
                  <span className={`ps-chip ps-chip-${h.color}`}>{h.state}</span>
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
            {[
              { d: '12', w: 'Вт', t: '18:30 → 19:30', title: 'Французский · Conditionnel',       who: 'Софья Ф.',        lang: 'fr', today: true },
              { d: '14', w: 'Чт', t: '19:00 → 20:00', title: 'Английский · Past perfect',         who: 'Татьяна К.',      lang: 'en', today: false },
              { d: '16', w: 'Сб', t: '12:00 → 13:00', title: 'Французский · Speaking club',       who: 'Pierre (носитель)', lang: 'fr', today: false },
              { d: '19', w: 'Вт', t: '18:30 → 19:30', title: 'Французский · Lecture',             who: 'Софья Ф.',        lang: 'fr', today: false },
            ].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-soft)', alignItems: 'center' }}>
                <div style={{
                  width: 46, textAlign: 'center', padding: '6px 0', borderRadius: 10, flexShrink: 0,
                  background: it.today ? 'var(--orange)' : 'var(--bg-cream)',
                  color:      it.today ? '#fff' : 'var(--ink-2)',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{it.d}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>{it.w}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 800, letterSpacing: '.08em' }}>{it.t}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{it.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{it.who}</div>
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
function DashTeacher({ t }) {
  return (
    <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: t('Уроков на неделе'),    v: '23',       d: '+4 к прошлой', up: true,  icon: 'calendar' },
          { l: t('Активных учеников'),   v: '31',       d: '2 новых',      up: true,  icon: 'users'    },
          { l: t('Средняя оценка'),      v: '4.9',      d: t('из 5'),      up: null,  icon: 'sparkle'  },
          { l: t('Доход за месяц'),      v: '₽ 84 200', d: '+12%',         up: true,  icon: 'wallet'   },
        ].map((k, i) => (
          <div key={i} className="ps-kpi">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--purple-deep)' }}>
              <Icon name={k.icon} size={16} />
              <div className="label">{k.l}</div>
            </div>
            <div className="val">{k.v}</div>
            <div className={`delta${k.up === true ? ' up' : k.up === false ? ' down' : ''}`}>{k.d}</div>
          </div>
        ))}
      </div>

      {/* Расписание + колонка справа */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 22 }}>

        {/* Timeline уроков */}
        <div className="ps-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <span className="ps-eyebrow">сегодня · вт, 12 мая</span>
              <h3 className="ps-display" style={{ fontSize: 24, margin: '4px 0 0' }}>5 уроков сегодня</h3>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ps-btn ps-btn-ghost ps-btn-sm">{t('Все')}</button>
              <button className="ps-btn ps-btn-primary ps-btn-sm"><Icon name="plus" size={12} /> {t('Новый слот')}</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { t: '10:00', dur: '60 мин', title: 'Французский A1 · Анна Соколова',             state: 'Завершён',    color: 'green',  lang: 'fr', active: false },
              { t: '12:30', dur: '60 мин', title: 'Английский B2 · Михаил Орлов',               state: 'Завершён',    color: 'green',  lang: 'en', active: false },
              { t: '15:00', dur: '45 мин', title: 'Французский A2 · Лиза + Кирилл (пара)',       state: 'Сейчас',      color: 'orange', lang: 'fr', active: true  },
              { t: '18:30', dur: '60 мин', title: 'Французский B1 · Анна Соколова',              state: 'Через 3ч',    color: 'purple', lang: 'fr', active: false },
              { t: '20:00', dur: '60 мин', title: 'Французский A2 · Speaking Club (4 ученика)',  state: 'Запланирован',color: 'purple', lang: 'fr', active: false },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px dashed var(--border)' : 'none', alignItems: 'center' }}>
                <div style={{ width: 64, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: s.active ? 'var(--orange-deep)' : 'var(--ink)', letterSpacing: '-0.02em' }}>{s.t}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700 }}>{s.dur}</div>
                </div>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: s.active ? 'var(--orange)' : 'var(--purple-soft)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>Zoom · готов план урока</div>
                </div>
                <span className={`ps-flag ps-flag-${s.lang}`} />
                <span className={`ps-chip ps-chip-${s.color}`}>{s.state}</span>
                {s.active
                  ? <button className="ps-btn ps-btn-primary ps-btn-sm"><Icon name="play" size={12} />В эфир</button>
                  : <button className="ps-btn ps-btn-ghost ps-btn-sm">···</button>
                }
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
              <span className="ps-chip ps-chip-orange">4</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { who: 'Анна С.',    what: 'Прислала эссе «Mes rêves»',      t: '1ч назад', c: 'orange' },
                { who: 'Лиза К.',   what: 'Просит перенести с пт на сб',     t: '3ч назад', c: 'purple' },
                { who: 'Михаил О.', what: 'Не пришёл на урок 09.05',         t: 'вчера',    c: 'red'    },
                { who: 'Кирилл В.', what: 'Новый ученик — план обучения',    t: 'вчера',    c: 'green'  },
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--purple-tint)', color: 'var(--purple-deep)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                    {n.who.split(' ').map(s => s[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{n.who}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{n.what}</div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 700, flexShrink: 0 }}>{n.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Нагрузка за неделю */}
          <div className="ps-card-purple" style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>нагрузка</span>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 22, margin: '4px 0 14px' }}>На этой неделе</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {[
                { d: 'ПН', h: 30 },
                { d: 'ВТ', h: 92, today: true },
                { d: 'СР', h: 60 },
                { d: 'ЧТ', h: 75 },
                { d: 'ПТ', h: 80 },
                { d: 'СБ', h: 50 },
                { d: 'ВС', h: 10 },
              ].map((b, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: `${b.h}%`, background: b.today ? 'var(--orange)' : 'rgba(255,255,255,0.3)', borderRadius: '6px 6px 3px 3px' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: b.today ? '#fff' : 'rgba(255,255,255,0.65)' }}>{b.d}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)', fontSize: 12 }}>
              <span style={{ opacity: 0.7 }}>Всего часов</span>
              <span style={{ fontWeight: 800 }}>23 / 28</span>
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

  // apiData заменит захардкоженные данные в DashStudent/DashTeacher когда бэкенд готов
  const { error } = useApi(
    () => (role === 'teacher' ? dashboardApi.getTeacher() : dashboardApi.getStudent()),
    [role],
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={DASH_TITLE[role] || 'Главная'} />

        {/* Переключатель ролей */}
        <div style={{ padding: '16px 28px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RoleSwitcher role={role} onChange={setRole} t={t} />
          {error && <ApiError message={error} />}
        </div>

        {/* Контент по роли */}
        {(role === 'student' || role === 'parent') && <DashStudent t={t} />}
        {(role === 'teacher' || role === 'admin')  && <DashTeacher t={t} />}
      </main>
    </div>
  )
}
