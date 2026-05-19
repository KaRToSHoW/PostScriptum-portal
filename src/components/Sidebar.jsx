import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon'
import Logo from './Logo'

/* ── Маршруты по id пункта ──────────────────────────────────── */
const ROUTE_MAP = {
  home:      '/dashboard',
  calendar:  '/calendar',
  finance:   '/admin/finance',
  roles:     '/admin/roles',
  homework:  '/homework',
  billing:   '/billing',
  profile:   '/profile',
}

/* ── id пункта по текущему маршруту ────────────────────────── */
function routeToItem(pathname) {
  if (pathname === '/dashboard')     return 'home'
  if (pathname === '/calendar')      return 'calendar'
  if (pathname === '/admin/finance') return 'finance'
  if (pathname === '/admin/roles')   return 'roles'
  if (pathname === '/homework')      return 'homework'
  if (pathname === '/billing')       return 'billing'
  if (pathname === '/profile')       return 'profile'
  return 'home'
}

const NAV = {
  student: [
    { sec: 'обучение', items: [
      { id: 'home',     label: 'Главная',         icon: 'home'     },
      { id: 'calendar', label: 'Расписание',       icon: 'calendar' },
      { id: 'courses',  label: 'Мои курсы',        icon: 'book'     },
      { id: 'homework', label: 'Домашние задания', icon: 'file', badge: 2 },
    ]},
    { sec: 'общение', items: [
      { id: 'chat',     label: 'Сообщения',        icon: 'chat', badge: 4 },
      { id: 'teachers', label: 'Преподаватели',    icon: 'users'    },
    ]},
    { sec: 'аккаунт', items: [
      { id: 'billing',  label: 'Абонементы',       icon: 'wallet'   },
      { id: 'profile',  label: 'Профиль',          icon: 'user'     },
    ]},
  ],
  teacher: [
    { sec: 'работа', items: [
      { id: 'home',      label: 'Главная',         icon: 'home'     },
      { id: 'calendar',  label: 'Расписание',      icon: 'calendar' },
      { id: 'students',  label: 'Мои ученики',     icon: 'users'    },
      { id: 'materials', label: 'Материалы',       icon: 'book'     },
    ]},
    { sec: 'общение', items: [
      { id: 'chat',     label: 'Сообщения',        icon: 'chat', badge: 3 },
      { id: 'homework', label: 'Домашние задания', icon: 'file'     },
    ]},
    { sec: 'аккаунт', items: [
      { id: 'earnings', label: 'Доход',            icon: 'wallet'   },
      { id: 'profile',  label: 'Профиль',          icon: 'user'     },
    ]},
  ],
  admin: [
    { sec: 'обзор', items: [
      { id: 'home',     label: 'Дашборд',          icon: 'grid'     },
      { id: 'calendar', label: 'Расписание',       icon: 'calendar' },
    ]},
    { sec: 'люди', items: [
      { id: 'students', label: 'Ученики',          icon: 'users'    },
      { id: 'teachers', label: 'Преподаватели',    icon: 'user'     },
      { id: 'roles',    label: 'Роли и доступ',    icon: 'shield'   },
      { id: 'leads',    label: 'Заявки',           icon: 'inbox', badge: 7 },
    ]},
    { sec: 'финансы', items: [
      { id: 'finance',  label: 'Финансы',          icon: 'wallet'   },
      { id: 'subs',     label: 'Абонементы',       icon: 'bookmark' },
      { id: 'reports',  label: 'Отчёты',           icon: 'chart'    },
    ]},
    { sec: 'система', items: [
      { id: 'courses',  label: 'Курсы и языки',    icon: 'globe'    },
      { id: 'settings', label: 'Настройки',        icon: 'cog'      },
    ]},
  ],
}

function SideItem({ icon, label, active, badge, onClick }) {
  return (
    <div
      className={`item${active ? ' active' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <span className="icon"><Icon name={icon} size={18} /></span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          background: 'var(--orange)', color: '#fff',
          fontSize: 10, fontWeight: 800,
          padding: '2px 7px', borderRadius: 999,
        }}>{badge}</span>
      )}
    </div>
  )
}

export default function Sidebar({ role = 'student' }) {
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const active    = routeToItem(pathname)
  const groups    = NAV[role] || NAV.student

  function handleClick(id) {
    const route = ROUTE_MAP[id]
    if (route) navigate(route)
    // пункты без маршрута — заглушка (будущие страницы)
  }

  return (
    <aside className="ps-side">
      {/* Логотип — клик ведёт на дашборд */}
      <div
        style={{ padding: '0 8px 18px', cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
        <Logo />
      </div>

      {groups.map((g, i) => (
        <div key={i}>
          <div className="sec">{g.sec}</div>
          {g.items.map(it => (
            <SideItem
              key={it.id}
              icon={it.icon}
              label={it.label}
              badge={it.badge}
              active={active === it.id}
              onClick={() => handleClick(it.id)}
            />
          ))}
        </div>
      ))}

      {/* Помощь */}
      <div style={{
        marginTop: 'auto', padding: 12, borderRadius: 14,
        background: 'var(--purple-tint)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: 22 }}>🐧</span>
        <div style={{ fontSize: 12, color: 'var(--purple-deep)', fontWeight: 700, lineHeight: 1.3 }}>
          Нужна помощь?<br />
          <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>Напишите менеджеру</span>
        </div>
      </div>
    </aside>
  )
}
