import { createContext, useContext, useState, useCallback } from 'react'
import { translate } from '../i18n'

export const USER_PRESETS = {
  student: { name: 'Анна Соколова',   initials: 'АС', subtitle: 'Ученик · французский B1' },
  teacher: { name: 'Софья Фролова',   initials: 'СФ', subtitle: 'Преподаватель · фр, англ'  },
  parent:  { name: 'Ирина Соколова',  initials: 'ИС', subtitle: 'Родитель · Анна Соколова'  },
  admin:   { name: 'Софья Фролова',   initials: 'СФ', subtitle: 'Администратор · Post Scriptum' },
}

export const SIDE_ROLE = {
  student: 'student',
  teacher: 'teacher',
  parent:  'student',
  admin:   'admin',
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [role,    setRole]    = useState(() => localStorage.getItem('ps_role')   ?? 'student')
  const [isAuth,  setIsAuth]  = useState(() => !!localStorage.getItem('ps_token'))
  const [apiUser, setApiUser] = useState(null)
  const [locale,  setLocaleRaw] = useState(() => localStorage.getItem('ps_locale') ?? 'ru')
  const [photo,   setPhotoRaw]  = useState(() => localStorage.getItem('ps_photo')  ?? null)

  const user     = apiUser ?? USER_PRESETS[role]
  const sideRole = SIDE_ROLE[role]

  const t = useCallback((key) => translate(key, locale), [locale])

  function setLocale(l) {
    localStorage.setItem('ps_locale', l)
    setLocaleRaw(l)
  }

  function setPhoto(dataUrl) {
    if (dataUrl) localStorage.setItem('ps_photo', dataUrl)
    else         localStorage.removeItem('ps_photo')
    setPhotoRaw(dataUrl)
  }

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
    <AppContext.Provider value={{ role, setRole, isAuth, login, logout, user, sideRole, locale, setLocale, t, photo, setPhoto }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
