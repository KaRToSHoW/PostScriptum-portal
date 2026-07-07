import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

/*
  Страница, на которую бэкенд возвращает браузер после входа через соцсеть:
    /oauth/callback?token=JWT      — успех
    /oauth/callback?error=...      — ошибка (отказ, неверный state и т.п.)
*/
const ERRORS = {
  denied:   'Вход отменён. Разрешите доступ, чтобы войти через соцсеть.',
  state:    'Сессия входа устарела. Попробуйте ещё раз.',
  provider: 'Этот способ входа недоступен.',
  oauth:    'Не удалось войти через соцсеть. Попробуйте ещё раз.',
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { login } = useApp()
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const err    = params.get('error')

    if (token) {
      login({ token })          // роль возьмётся из самого JWT, профиль подтянется в AppContext
      navigate('/dashboard', { replace: true })
    } else {
      setError(ERRORS[err] ?? ERRORS.oauth)
    }
  }, [login, navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-cream)', padding: 24 }}>
      <div className="ps-card" style={{ padding: 32, textAlign: 'center', maxWidth: 380 }}>
        {error ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
            <h3 className="ps-display" style={{ fontSize: 20, margin: '0 0 8px' }}>Не получилось войти</h3>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 18 }}>{error}</div>
            <button className="ps-btn ps-btn-primary" onClick={() => navigate('/login', { replace: true })}>
              Вернуться ко входу
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
            <h3 className="ps-display" style={{ fontSize: 20, margin: 0 }}>Входим...</h3>
          </>
        )}
      </div>
    </div>
  )
}
