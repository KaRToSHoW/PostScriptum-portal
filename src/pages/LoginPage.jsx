import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { authApi } from '../api/auth'
import { api } from '../api/client'
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
   Кнопки входа через соцсети (VK / Яндекс)
   ============================================================ */
const API_BASE = import.meta.env.VITE_API_URL ?? ''

const VK_APP_ID       = 54669868
const VK_REDIRECT_URL = 'https://postscriptum-online.ru/api/auth/oauth/vk/callback'
const VK_SDK_URL      = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js'

function goOAuth(provider) {
  // Уводим браузер на бэкенд — он редиректит к провайдеру и обратно на /oauth/callback
  window.location.href = `${API_BASE}/api/auth/oauth/${provider}`
}

/* Оригинальные иконки соцсетей */
function VkIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <rect width="24" height="24" rx="6" fill="#0077FF"/>
      <path fill="#fff" d="M12.785 17.242c-4.842 0-7.604-3.319-7.719-8.842h2.425c.08 4.054 1.868 5.771 3.284 6.125V8.4h2.284v3.496c1.398-.15 2.867-1.743 3.362-3.496h2.284c-.38 2.16-1.974 3.753-3.107 4.408 1.133.53 2.948 1.92 3.638 4.434h-2.514c-.54-1.682-1.885-2.983-3.663-3.16v3.16h-.274Z"/>
    </svg>
  )
}

function YandexIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
      <path fill="#fff" d="M13.32 7.666h-1.204c-2.09 0-3.157 1.06-3.157 2.622 0 1.764.71 2.591 2.242 3.632l1.247.84-3.583 5.24H6.19l3.291-4.847c-1.893-1.348-2.955-2.67-2.955-4.887 0-2.774 1.933-4.666 5.532-4.666h3.585v14.4H13.32V7.666Z"/>
    </svg>
  )
}

function SocialButtons({ onSuccess }) {
  const vkRef = useRef(null)
  const [vkError, setVkError] = useState('')

  useEffect(() => {
    let cancelled = false

    function initVk() {
      if (cancelled || !window.VKIDSDK || !vkRef.current || vkRef.current.childElementCount > 0) return
      const VKID = window.VKIDSDK

      VKID.Config.init({
        app: VK_APP_ID,
        redirectUrl: VK_REDIRECT_URL,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: 'email phone',
      })

      const oneTap = new VKID.OneTap()
      oneTap.render({
        container: vkRef.current,
        showAlternativeLogin: true,
        skin: 'secondary',
        styles: { borderRadius: 12, height: 44 },
      })
      .on(VKID.WidgetEvents.ERROR, () => setVkError('VK ID недоступен'))
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload) => {
        VKID.Auth.exchangeCode(payload.code, payload.device_id)
          .then(data => api.post('/api/auth/oauth/vk/token', { accessToken: data.access_token }))
          .then(resp => onSuccess?.(resp))
          .catch(() => setVkError('Не удалось войти через VK'))
      })
    }

    if (window.VKIDSDK) {
      initVk()
    } else {
      const s = document.createElement('script')
      s.src = VK_SDK_URL
      s.async = true
      s.onload = initVk
      s.onerror = () => setVkError('vk-sdk')
      document.head.appendChild(s)
    }
    return () => { cancelled = true }
  }, [onSuccess])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Виджет VK ID OneTap; если не загрузился — обычная кнопка с редиректом */}
      {!vkError && <div ref={vkRef} style={{ minHeight: 44 }} />}
      {vkError && (
        <button
          type="button"
          onClick={() => goOAuth('vk')}
          className="ps-btn ps-btn-outline"
          style={{ padding: 12, fontSize: 12, justifyContent: 'center' }}
        >
          <VkIcon /> Войти через VK
        </button>
      )}
      <button
        type="button"
        onClick={() => goOAuth('yandex')}
        className="ps-btn ps-btn-outline"
        style={{ padding: 12, fontSize: 12, justifyContent: 'center' }}
      >
        <YandexIcon /> Войти через Яндекс
      </button>
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
      <SocialButtons onSuccess={onSuccess} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/ps-logo.jpg" alt="P.S." style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(255,255,255,.25)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 19, letterSpacing: '.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>
              Post <span style={{ color: 'var(--orange-soft)' }}>Scriptum</span>
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.8, fontStyle: 'italic', marginTop: 4, letterSpacing: '.01em' }}>
              онлайн-школа иностранных языков
            </div>
          </div>
        </div>

        {/* Слоган в стиле плаката — со сдвигом строк */}
        <div style={{ marginTop: 30, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1.12, letterSpacing: '-0.02em', textTransform: 'lowercase' }}>
          <div style={{ color: 'rgba(255,255,255,.45)' }}>искусство</div>
          <div style={{ color: '#fff', marginLeft: 22 }}>свободной</div>
          <div style={{ color: 'rgba(255,255,255,.45)', marginLeft: 44 }}>речи</div>
        </div>

        {/* Заголовок */}
        <div style={{ marginTop: 48, position: 'relative' }}>
          <span className="ps-dotted" style={{ color: '#FBE3C5', borderColor: '#FBE3C5' }}>
            добро пожаловать
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
