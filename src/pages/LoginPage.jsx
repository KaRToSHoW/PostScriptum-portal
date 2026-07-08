import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { authApi } from '../api/auth'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import bossPng     from '../assets/Boss-pinguin.svg'
import computerPng from '../assets/Computer-pinguin.svg'
import happyPng    from '../assets/Happy-pinguin.svg'
import popcornPng  from '../assets/Popcorn-pinguin.svg'
import twoPng      from '../assets/Two-pinguins.svg'
import wowPng      from '../assets/WoW-pinguin.svg'

/* ============================================================
   Хаотично падающие пингвины (декор правой панели)
   ============================================================ */
const PENGUINS = [bossPng, computerPng, happyPng, popcornPng, twoPng, wowPng]

function FallingPenguins({ count = 11 }) {
  // параметры каждого пингвина фиксируем один раз на маунт
  const items = useMemo(() => Array.from({ length: count }, () => ({
    src:      PENGUINS[Math.floor(Math.random() * PENGUINS.length)],
    left:     Math.random() * 100,               // %
    size:     34 + Math.random() * 50,           // px
    duration: 8 + Math.random() * 10,            // c
    delay:    -Math.random() * 18,               // c (отрицательная — уже в полёте)
    sway:     (Math.random() * 2 - 1) * 60,      // px горизонтальный снос
    rot:      (Math.random() * 2 - 1) * 300,     // deg кувырок
    opacity:  0.45 + Math.random() * 0.45,
  })), [count])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {items.map((p, i) => (
        <img
          key={i}
          src={p.src}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            opacity: p.opacity,
            willChange: 'transform',
            animation: `ps-fall ${p.duration}s linear ${p.delay}s infinite`,
            '--sway': `${p.sway}px`,
            '--rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}

/* ============================================================
   Флаги языков
   ============================================================ */
function Flags() {
  const st = { width: 58, height: 58, boxShadow: 'inset 0 0 0 2px #fff, 0 0 0 2px rgba(255,255,255,.4), 0 6px 18px rgba(0,0,0,.2)' }
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <span className="ps-flag ps-flag-fr" style={st} title="Французский" />
      <span className="ps-flag ps-flag-en" style={st} title="Английский" />
      <span className="ps-flag ps-flag-de" style={st} title="Немецкий" />
      <span className="ps-flag ps-flag-es" style={st} title="Испанский" />
      <span className="ps-flag ps-flag-it" style={st} title="Итальянский" />
    </div>
  )
}

/* ============================================================
   Кнопки входа через соцсети (VK / Яндекс)
   ============================================================ */
const API_BASE = import.meta.env.VITE_API_URL ?? ''

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

function SocialButton({ onClick, icon, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', height: 46, borderRadius: 12, cursor: 'pointer',
        border: `1.5px solid ${hover ? 'var(--purple)' : 'var(--border)'}`,
        background: hover ? 'var(--purple-tint)' : '#fff',
        fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 700, color: 'var(--ink)',
        transition: 'background .12s, border-color .12s',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function SocialButtons() {
  // Яндекс и VK — одинаковые кнопки: тот же шрифт, размер и иконка-логотип
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SocialButton onClick={() => goOAuth('yandex')} icon={<YandexIcon size={20} />}>
        Войти через Яндекс
      </SocialButton>
      <SocialButton onClick={() => goOAuth('vk')} icon={<VkIcon size={20} />}>
        Войти через VK
      </SocialButton>
    </div>
  )
}

/* ============================================================
   Модалка «Забыл пароль?»
   ============================================================ */
function ForgotPasswordModal({ initialEmail = '', onClose, onSuccess }) {
  const [email, setEmail]   = useState(initialEmail)
  const [pwd, setPwd]       = useState('')
  const [pwd2, setPwd2]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!email)            { setError('Введите email'); return }
    if (pwd.length < 6)    { setError('Пароль минимум 6 символов'); return }
    if (pwd !== pwd2)      { setError('Пароли не совпадают'); return }
    setError(''); setLoading(true)
    try {
      const res = await authApi.resetPassword(email.trim(), pwd)
      onSuccess?.(res)   // пароль обновлён — сразу входим
    } catch (err) {
      setError(err.message || 'Не удалось сменить пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'grid', placeItems: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)', padding: 20 }}
    >
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px', position: 'relative' }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.15)', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon name="plus" size={13} style={{ transform: 'rotate(45deg)' }} />
          </button>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 19, margin: 0 }}>Забыли пароль?</h3>
          <p style={{ fontSize: 12.5, opacity: 0.85, margin: '6px 0 0', lineHeight: 1.5 }}>
            Введите email и задайте новый пароль — сразу войдёте.
          </p>
        </div>
        <form onSubmit={submit} noValidate style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>{error}</div>
          )}
          <div>
            <label className="ps-input-label">EMAIL</label>
            <input className="ps-input" type="email" placeholder="your@email.ru" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="ps-input-label">НОВЫЙ ПАРОЛЬ</label>
            <div style={{ position: 'relative' }}>
              <input className="ps-input" type={showPwd ? 'text' : 'password'} placeholder="Минимум 6 символов" value={pwd} onChange={e => setPwd(e.target.value)} autoComplete="new-password" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex' }}>
                <Icon name={showPwd ? 'eyeOff' : 'eye'} size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="ps-input-label">ПОВТОРИТЕ ПАРОЛЬ</label>
            <input className="ps-input" type={showPwd ? 'text' : 'password'} placeholder="Повторите пароль" value={pwd2} onChange={e => setPwd2(e.target.value)} autoComplete="new-password" />
          </div>
          <button type="submit" className="ps-btn ps-btn-primary" style={{ width: '100%', padding: '14px 22px', fontSize: 14, marginTop: 4 }} disabled={loading}>
            {loading ? 'Сохраняем...' : <>Сменить пароль и войти <Icon name="arrow" size={14} /></>}
          </button>
        </form>
      </div>
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
  const [forgot, setForgot]     = useState(false)
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
    <>
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
          {/* Пока нефункциональна — заработает, когда сделаем сброс по почте */}
          <a
            href="#"
            onClick={e => e.preventDefault()}
            style={{ color: 'var(--purple-deep)', fontWeight: 700, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}
          >
            Забыль пароль?
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
      <SocialButtons />
    </form>
    {forgot && (
      <ForgotPasswordModal
        initialEmail={email}
        onClose={() => setForgot(false)}
        onSuccess={onSuccess}
      />
    )}
    </>
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
        <label className="ps-input-label">И ЕЩЁ РАЗОЧЕК</label>
        <div style={{ position: 'relative' }}>
          <input
            className="ps-input"
            type={showPwd ? 'text' : 'password'}
            placeholder="Повторите пароль"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            autoComplete="new-password"
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            tabIndex={-1}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex' }}
          >
            <Icon name={showPwd ? 'eyeOff' : 'eye'} size={16} />
          </button>
        </div>
      </div>

      {/* Зарегистрироваться */}
      <button
        type="submit"
        className="ps-btn ps-btn-primary"
        style={{ width: '100%', padding: '16px 22px', fontSize: 14, marginTop: 4 }}
        disabled={loading}
      >
        {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
      </button>

      <p style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
        Регистрируясь, Вы соглашаетесь с{' '}
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
        flex: '0 0 552px',
        background: 'var(--purple)',
        color: '#fff',
        padding: '48px 38px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Логотип — по центру сверху */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <img src="/ps-logo.jpg" alt="P.S." style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 3px rgba(255,255,255,.25)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, letterSpacing: '.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>
              Post <span style={{ color: 'var(--orange-soft)' }}>Scriptum</span>
            </div>
            <div style={{ fontSize: 15, opacity: 0.8, fontStyle: 'italic', marginTop: 4, letterSpacing: '.01em' }}>
              онлайн-школа иностранных языков
            </div>
          </div>
        </div>

        {/* Слоган-плакат — на весь блок: растянут по вертикали и максимально крупно */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, lineHeight: 1.12, letterSpacing: '-0.03em', textTransform: 'lowercase', whiteSpace: 'nowrap' }}>
          <div style={{ color: 'rgba(255,255,255,.5)' }}>искусство</div>
          <div style={{ color: '#fff', marginLeft: 16 }}>свободной</div>
          <div style={{ color: 'rgba(255,255,255,.5)', marginLeft: 48 }}>речи</div>
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
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 32 }}>
            © 2026 Post Scriptum ·{' '}
            <a
              href="https://postscriptum-online.ru"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--orange-soft)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}
            >
              postscriptum-online.ru
            </a>
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
        position: 'relative',
      }}>
        {/* Хаотично падающие пингвины — за формой */}
        <FallingPenguins />

        <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Табы Войти / Зарегистрироваться — плавный переключатель, по ширине формы */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              width: '100%',
              background: 'var(--bg-cream)',
              borderRadius: 'var(--r-pill)',
              padding: 4,
              border: '1px solid var(--border)',
            }}>
              {/* Плавный бегунок */}
              <div style={{
                position: 'absolute',
                top: 4, bottom: 4, left: 4,
                width: 'calc(50% - 4px)',
                borderRadius: 'var(--r-pill)',
                background: '#fff',
                boxShadow: 'var(--shadow-card)',
                transform: tab === 'register' ? 'translateX(100%)' : 'translateX(0)',
                transition: 'transform .32s cubic-bezier(.34,1.4,.5,1)',
              }} />
              {[
                { key: 'login',    label: 'Войти' },
                { key: 'register', label: 'Зарегистрироваться' },
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 'var(--r-pill)',
                    fontSize: 13,
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: tab === t.key ? 'var(--ink)' : 'var(--ink-muted)',
                    transition: 'color .25s ease',
                    letterSpacing: '0.01em',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Заголовок */}
          <h2 className="ps-display" style={{ fontSize: 32, margin: '0 0 6px', whiteSpace: 'nowrap' }}>
            {tab === 'login' ? 'С возвращением!' : 'Добро пожаловать!'}
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {tab === 'login'
              ? 'Введите email и пароль или войдите через соцсеть.'
              : <>Мы Вам очень-очень рады
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--orange)" style={{ flexShrink: 0 }}>
                    <path d="M12 21s-6.716-4.35-9.333-8.018C.9 10.28 1.53 6.9 4.222 5.6c2.09-1.01 4.48-.31 5.778 1.4.5.66.8 1 2 1s1.5-.34 2-1c1.298-1.71 3.688-2.41 5.778-1.4 2.692 1.3 3.322 4.68 1.555 7.382C18.716 16.65 12 21 12 21z"/>
                  </svg>
                </>}
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
