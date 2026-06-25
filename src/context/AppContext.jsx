import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { translate } from '../i18n'
import { profileApi } from '../api/profile'

export const USER_PRESETS = {
  student: { name: 'Анна Соколова',   initials: 'АС', subtitle: 'Ученик · французский B1' },
  teacher: { name: 'Софья Фролова',   initials: 'СФ', subtitle: 'Преподаватель · фр, англ'  },
  parent:  { name: 'Ирина Соколова',  initials: 'ИС', subtitle: 'Родитель · Анна Соколова'  },
  admin:   { name: 'Софья Фролова',   initials: 'СФ', subtitle: 'Администратор · Post Scriptum' },
}

export const SIDE_ROLE = {
  student: 'student',
  teacher: 'teacher',
  parent:  'parent',
  admin:   'admin',
  manager: 'admin',
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [role,    setRole]    = useState(() => localStorage.getItem('ps_role')   ?? 'student')
  const [isAuth,  setIsAuth]  = useState(() => !!localStorage.getItem('ps_token'))
  const [apiUser, setApiUser] = useState(() => {
    const raw = localStorage.getItem('ps_user')
    return raw ? JSON.parse(raw) : null
  })
  const [locale,  setLocaleRaw] = useState(() => localStorage.getItem('ps_locale') ?? 'ru')
  const [photo,   setPhotoRaw]  = useState(() => localStorage.getItem('ps_photo')  ?? null)

  // Re-fetch the real profile from the backend after reload so we don't show stale preset data
  useEffect(() => {
    if (!isAuth) return
    profileApi.get().then(data => {
      const fresh = { name: data.name, initials: data.name?.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2), subtitle: data.email }
      localStorage.setItem('ps_user', JSON.stringify(fresh))
      setApiUser(fresh)
      if (data.avatarUrl) setPhoto(data.avatarUrl)
    }).catch(() => {/* token may be stale — leave preset/cached data as-is */})
  }, [isAuth])

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
    if (name) {
      const fresh = { name, initials: initials ?? name.split(' ').map(s => s[0]).join(''), subtitle: subtitle ?? '' }
      localStorage.setItem('ps_user', JSON.stringify(fresh))
      setApiUser(fresh)
    }
  }

  function logout() {
    localStorage.removeItem('ps_token')
    localStorage.removeItem('ps_role')
    localStorage.removeItem('ps_user')
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
