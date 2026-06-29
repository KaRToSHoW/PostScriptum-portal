import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon'
import Logo from './Logo'
import { useApp } from '../context/AppContext'

const ROUTE_MAP = {
  home:      '/dashboard',
  calendar:  '/calendar',
  finance:   '/admin/finance',
  roles:     '/admin/roles',
  homework:  '/homework',
  billing:   '/billing',
  profile:   '/profile',
  chat:      '/messages',
  teachers:  '/teachers',
  students:  '/students',
  users:     '/admin/users',
  children:  '/children',
  leads:     '/leads',
  settings:  '/settings',
  subs:      '/admin/subscriptions',
  earnings:  '/billing',
  materials: '/homework',
  reports:   '/admin/reports',
}

function routeToItem(pathname) {
  if (pathname === '/dashboard')     return 'home'
  if (pathname === '/calendar')      return 'calendar'
  if (pathname === '/admin/finance') return 'finance'
  if (pathname === '/admin/roles')   return 'roles'
  if (pathname === '/homework')      return 'homework'
  if (pathname === '/billing')       return 'billing'
  if (pathname === '/profile')       return 'profile'
  if (pathname === '/settings')      return 'settings'
  if (pathname === '/messages')      return 'chat'
  if (pathname === '/teachers')      return 'teachers'
  if (pathname === '/students')      return 'students'
  if (pathname === '/admin/users')          return 'users'
  if (pathname === '/children')             return 'children'
  if (pathname === '/leads')                return 'leads'
  if (pathname === '/admin/reports')        return 'reports'
  if (pathname === '/admin/subscriptions')  return 'subs'
  return 'home'
}

const NAV = {
  student: [
    { sec: 'обучение', items: [
      { id: 'home',     label: 'Главная',         icon: 'home'     },
      { id: 'calendar', label: 'Расписание',       icon: 'calendar' },
      { id: 'homework', label: 'Домашние задания', icon: 'file' },
    ]},
    { sec: 'общение', items: [
      { id: 'chat',     label: 'Сообщения',        icon: 'chat' },
      { id: 'teachers', label: 'Преподаватели',    icon: 'users'    },
    ]},
    { sec: 'аккаунт', items: [
      { id: 'billing',  label: 'Абонементы',       icon: 'wallet'   },
      { id: 'profile',  label: 'Профиль',          icon: 'user'     },
    ]},
  ],
  parent: [
    { sec: 'обзор', items: [
      { id: 'children', label: 'Мои дети',         icon: 'users'    },
      { id: 'calendar', label: 'Расписание',       icon: 'calendar' },
    ]},
    { sec: 'общение', items: [
      { id: 'chat',     label: 'Сообщения',        icon: 'chat'     },
      { id: 'teachers', label: 'Преподаватели',    icon: 'user'     },
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
      { id: 'chat',     label: 'Сообщения',        icon: 'chat' },
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
      { id: 'users',    label: 'Пользователи',     icon: 'users'    },
      { id: 'students', label: 'Ученики',          icon: 'user'     },
      { id: 'teachers', label: 'Преподаватели',    icon: 'sparkle'  },
      { id: 'roles',    label: 'Роли и доступ',    icon: 'shield'   },
    ]},
    { sec: 'общение', items: [
      { id: 'chat',     label: 'Сообщения',        icon: 'chat'     },
    ]},
    { sec: 'финансы', items: [
      { id: 'finance',  label: 'Финансы',          icon: 'wallet'   },
      { id: 'subs',     label: 'Абонементы',       icon: 'bookmark' },
      { id: 'reports',  label: 'Отчёты',           icon: 'chart'    },
    ]},
    { sec: 'система', items: [
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
  const { t } = useApp()
  const active    = routeToItem(pathname)
  const groups    = NAV[role] || NAV.student

  function handleClick(id) {
    const route = ROUTE_MAP[id]
    if (route) navigate(route)
  }

  return (
    <aside className="ps-side">
      <div
        style={{ padding: '0 8px 18px', cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
        <Logo />
      </div>

      {groups.map((g, i) => (
        <div key={i}>
          <div className="sec">{t(g.sec)}</div>
          {g.items.map(it => (
            <SideItem
              key={it.id}
              icon={it.icon}
              label={t(it.label)}
              badge={it.badge}
              active={active === it.id}
              onClick={() => handleClick(it.id)}
            />
          ))}
        </div>
      ))}

      <div style={{
        marginTop: 'auto', padding: 12, borderRadius: 14,
        background: 'var(--purple-tint)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: 22 }}>🐧</span>
        <div style={{ fontSize: 12, color: 'var(--purple-deep)', fontWeight: 700, lineHeight: 1.3 }}>
          {t('Нужна помощь?')}<br />
          <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>{t('Напишите менеджеру')}</span>
        </div>
      </div>
    </aside>
  )
}
