import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { authApi } from '../api/auth'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

/* ============================================================
   Флаги языков
   ============================================================ */
function Flags() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span className="ps-flag ps-flag-fr" title="Французский" />
      <span className="ps-flag ps-flag-en" title="Английский" />
      <span className="ps-flag ps-flag-de" title="Немецкий" />
      <span className="ps-flag ps-flag-es" title="Испанский" />
      <span className="ps-flag ps-flag-it" title="Итальянский" />
    </div>
  )
}

/* ============================================================
   Форма ВХОДА
   ============================================================ */
function LoginForm({ onSuccess }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Заполните все поля'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      onSuccess?.(res)
    } catch (err) {
      if (import.meta.env.DEV && err.message === 'Failed to fetch') {
        // Бэкенд не запущен локально — dev-заглушка
        onSuccess?.({})
      } else {
        setError(err.message === 'Unauthorized' || err.message?.includes('email')
          ? 'Неверный email или пароль'
          : (err.message || 'Неверный email или пароль'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div style={{
          background: 'var(--danger-soft)', color: 'var(--danger)',
          borderRadius: 'var(--r-md)', padding: '10px 14px',
          fontSize: 13, fontWeight: 700,
        }}>
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="ps-input-label">EMAIL</label>
        <input
          className="ps-input"
          type="email"
          placeholder="your@email.ru"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      {/* Пароль */}
      <div>
        <label className="ps-input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>ПАРОЛЬ</span>
          <a
            href="#"
            onClick={e => e.preventDefault()}
            style={{ color: 'var(--purple-deep)', fontWeight: 700, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}
          >
            Восстановить
          </a>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            className="ps-input"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--ink-muted)', display: 'flex',
            }}
            tabIndex={-1}
          >
            <Icon name={showPwd ? 'eyeOff' : 'eye'} size={16} />
          </button>
        </div>
      </div>

      {/* Запомнить */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
        <span
          onClick={() => setRemember(v => !v)}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            background: remember ? 'var(--purple)' : '#fff',
            border: remember ? 'none' : '1.5px solid var(--border)',
            display: 'grid', placeItems: 'center', color: '#fff',
            transition: 'background .12s',
            cursor: 'pointer',
          }}
        >
          {remember && <Icon name="check" size={12} />}
        </span>
        Запомнить меня на этом устройстве
      </label>

      {/* Войти */}
      <button
        type="submit"
        className="ps-btn ps-btn-primary"
        style={{ width: '100%', padding: '16px 22px', fontSize: 14, marginTop: 4 }}
        disabled={loading}
      >
        {loading ? 'Входим...' : <>Войти <Icon name="arrow" size={14} /></>}
      </button>

      {/* OR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-muted)', fontSize: 12, fontWeight: 700 }}>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        ИЛИ
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Соцсети */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button type="button" className="ps-btn ps-btn-outline" style={{ padding: 12, fontSize: 12 }}>
          <span style={{
            width: 16, height: 16, borderRadius: 4,
            background: '#4C75A3', display: 'inline-grid',
            placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0,
          }}>VK</span>
          ВКонтакте
        </button>
        <button type="button" className="ps-btn ps-btn-outline" style={{ padding: 12, fontSize: 12 }}>
          <span style={{
            width: 16, height: 16, borderRadius: 4,
            background: '#fff', display: 'inline-grid',
            placeItems: 'center', fontSize: 10, fontWeight: 800,
            color: '#4285F4', border: '1px solid var(--border)', flexShrink: 0,
          }}>G</span>
          Google
        </button>
      </div>
    </form>
  )
}

/* ============================================================
   Форма РЕГИСТРАЦИИ
   ============================================================ */
function RegisterForm({ onSuccess }) {
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name || !email || !password) { setError('Заполните все поля'); return }
    if (password !== password2)       { setError('Пароли не совпадают'); return }
    if (password.length < 6)          { setError('Пароль минимум 6 символов'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(name, email, password)
      onSuccess?.(res)
    } catch (err) {
      if (import.meta.env.DEV && err.message === 'Failed to fetch') {
        onSuccess?.({})
      } else {
        setError(err.message || 'Ошибка регистрации. Попробуйте снова.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div style={{
          background: 'var(--danger-soft)', color: 'var(--danger)',
          borderRadius: 'var(--r-md)', padding: '10px 14px',
          fontSize: 13, fontWeight: 700,
        }}>
          {error}
        </div>
      )}

      {/* Имя */}
      <div>
        <label className="ps-input-label">ИМЯ И ФАМИЛИЯ</label>
        <input
          className="ps-input"
          type="text"
          placeholder="Анна Смирнова"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="ps-input-label">EMAIL</label>
        <input
          className="ps-input"
          type="email"
          placeholder="your@email.ru"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      {/* Пароль */}
      <div>
        <label className="ps-input-label">ПАРОЛЬ</label>
        <div style={{ position: 'relative' }}>
          <input
            className="ps-input"
            type={showPwd ? 'text' : 'password'}
            placeholder="Минимум 6 символов"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--ink-muted)', display: 'flex',
            }}
            tabIndex={-1}
          >
            <Icon name={showPwd ? 'eyeOff' : 'eye'} size={16} />
          </button>
        </div>
      </div>

      {/* Повтор пароля */}
      <div>
        <label className="ps-input-label">ПОВТОРИТЕ ПАРОЛЬ</label>
        <input
          className="ps-input"
          type={showPwd ? 'text' : 'password'}
          placeholder="Повторите пароль"
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {/* Зарегистрироваться */}
      <button
        type="submit"
        className="ps-btn ps-btn-primary"
        style={{ width: '100%', padding: '16px 22px', fontSize: 14, marginTop: 4 }}
        disabled={loading}
      >
        {loading ? 'Создаём аккаунт...' : <>Создать аккаунт <Icon name="sparkle" size={14} /></>}
      </button>

      <p style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
        Регистрируясь, вы соглашаетесь с{' '}
        <a href="#" style={{ color: 'var(--purple-deep)', fontWeight: 700 }}>условиями использования</a>
      </p>
    </form>
  )
}

/* ============================================================
   СТРАНИЦА LOGIN (Split-вариант из концепта)
   ============================================================ */
export default function LoginPage() {
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const navigate = useNavigate()
  const { login } = useApp()

  function onSuccess(apiResponse = {}) {
    login(apiResponse)   // { token, role, name, initials, subtitle } от Java API
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-cream)',
      overflow: 'hidden',
    }}>

      {/* ===== ЛЕВАЯ ПАНЕЛЬ ===== */}
      <div style={{
        flex: '0 0 520px',
        background: 'var(--purple)',
        color: '#fff',
        padding: '60px 56px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Логотип */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/ps-logo.svg" alt="P.S." style={{ width: 56, height: 56 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
              Post Scriptum
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>языковая школа</div>
          </div>
        </div>

        {/* Заголовок */}
        <div style={{ marginTop: 72, position: 'relative' }}>
          <span className="ps-dotted" style={{ color: '#FBE3C5', borderColor: '#FBE3C5' }}>
            искусство свободы
          </span>
          <h1 className="ps-display ps-display-purple" style={{ fontSize: 52, marginTop: 22, lineHeight: 1 }}>
            Заговори<br />на языке<br />
            <span style={{ color: 'var(--orange-soft)' }}>своей мечты</span>
          </h1>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, maxWidth: 380, marginTop: 20 }}>
            Расписание, домашние задания, материалы, оплаты и чат с преподавателем — в одном месте.
          </p>
        </div>

        {/* Флаги + статистика */}
        <div style={{ marginTop: 'auto' }}>
          <Flags />
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', marginTop: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>
                1 200+
              </div>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>
                учеников
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.25)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>
                32
              </div>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>
                преподавателя
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.25)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>
                5
              </div>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>
                языков
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 32 }}>
            © 2026 Post Scriptum · postscriptumfr.ru
          </div>
        </div>

        {/* Декоративная надпись P.S. */}
        <div style={{
          position: 'absolute',
          right: -60, top: 240,
          fontFamily: 'var(--font-display)',
          fontSize: 280, fontWeight: 900,
          color: 'rgba(255,255,255,0.055)',
          letterSpacing: '-0.05em',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1,
        }}>
          P.S.
        </div>
      </div>

      {/* ===== ПРАВАЯ ПАНЕЛЬ (форма) ===== */}
      <div style={{
        flex: 1,
        padding: '60px 80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>

          {/* Табы Войти / Зарегистрироваться */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-cream)',
            borderRadius: 'var(--r-pill)',
            padding: 4,
            marginBottom: 28,
            border: '1px solid var(--border)',
          }}>
            {[
              { key: 'login',    label: 'Войти' },
              { key: 'register', label: 'Зарегистрироваться' },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background .15s, box-shadow .15s, color .15s',
                  background: tab === t.key ? '#fff' : 'transparent',
                  color:      tab === t.key ? 'var(--ink)' : 'var(--ink-muted)',
                  boxShadow:  tab === t.key ? 'var(--shadow-card)' : 'none',
                  letterSpacing: '0.01em',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Заголовок */}
          <h2 className="ps-display" style={{ fontSize: 36, margin: '0 0 6px' }}>
            {tab === 'login' ? 'С возвращением!' : 'Создать аккаунт'}
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.5 }}>
            {tab === 'login'
              ? 'Введите email и пароль, либо войдите через соцсеть.'
              : 'Заполните данные — это займёт меньше минуты.'}
          </p>

          {/* Форма */}
          {tab === 'login'
            ? <LoginForm    onSuccess={onSuccess} />
            : <RegisterForm onSuccess={onSuccess} />
          }

        </div>
      </div>
    </div>
  )
}
