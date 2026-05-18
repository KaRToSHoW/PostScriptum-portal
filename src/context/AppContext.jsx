import { createContext, useContext, useState } from 'react'

/* ── Дефолтные данные пользователя по роли (fallback до API) ─── */
export const USER_PRESETS = {
  student: { name: 'Анна Соколова',   initials: 'АС', subtitle: 'Ученик · французский B1' },
  teacher: { name: 'Софья Фролова',   initials: 'СФ', subtitle: 'Преподаватель · фр, англ'  },
  parent:  { name: 'Ирина Соколова',  initials: 'ИС', subtitle: 'Родитель · Анна Соколова'  },
  admin:   { name: 'Софья Фролова',   initials: 'СФ', subtitle: 'Администратор · Post Scriptum' },
}

/* ── Роль → сайдбар ─────────────────────────────────────────── */
export const SIDE_ROLE = {
  student: 'student',
  teacher: 'teacher',
  parent:  'student',
  admin:   'admin',
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [role,    setRole]    = useState(() => localStorage.getItem('ps_role') ?? 'student')
  const [isAuth,  setIsAuth]  = useState(() => !!localStorage.getItem('ps_token'))
  const [apiUser, setApiUser] = useState(null)  // данные с сервера перекрывают USER_PRESETS

  const user     = apiUser ?? USER_PRESETS[role]
  const sideRole = SIDE_ROLE[role]

  /*
    Вызывается после успешного /api/auth/login или /api/auth/register.
    Ожидаемый ответ от Java API:
    { token, role, name, initials, subtitle }
  */
  function login({ token, role: r, name, initials, subtitle } = {}) {
    const resolvedRole = r ?? 'student'
    if (token) localStorage.setItem('ps_token', token)
    localStorage.setItem('ps_role', resolvedRole)
    setRole(resolvedRole)
    setIsAuth(true)
    if (name) setApiUser({ name, initials: initials ?? name.split(' ').map(s => s[0]).join(''), subtitle: subtitle ?? '' })
  }

  function logout() {
    localStorage.removeItem('ps_token')
    localStorage.removeItem('ps_role')
    setIsAuth(false)
    setApiUser(null)
    setRole('student')
  }

  return (
    <AppContext.Provider value={{ role, setRole, isAuth, login, logout, user, sideRole }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
