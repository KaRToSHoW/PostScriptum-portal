import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth'
import Icon from '../components/Icon'

/* ============================================================
   Установка нового пароля по ссылке из письма (?token=...)
   ============================================================ */
export default function ResetPasswordPage() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const token     = params.get('token') || ''

  const [pwd, setPwd]         = useState('')
  const [pwd2, setPwd2]       = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (pwd.length < 6) { setError('Пароль минимум 6 символов'); return }
    if (pwd !== pwd2)   { setError('Пароли не совпадают'); return }
    setError(''); setLoading(true)
    try {
      await authApi.resetPassword(token, pwd)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Ссылка недействительна или устарела')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-cream)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/ps-logo.jpg" alt="P.S." style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: 0 }}>Новый пароль</h3>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>Post Scriptum</div>
          </div>
        </div>

        {!token ? (
          <div style={{ padding: 26, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40 }}>🔗</div>
            <p style={{ fontSize: 14, color: 'var(--ink)', margin: 0, lineHeight: 1.55 }}>
              Ссылка неполная или повреждена. Запросите сброс пароля заново на странице входа.
            </p>
            <button className="ps-btn ps-btn-primary" style={{ width: '100%', padding: '14px 22px', fontSize: 14 }} onClick={() => navigate('/login')}>
              На страницу входа
            </button>
          </div>
        ) : done ? (
          <div style={{ padding: 26, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 42 }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Пароль изменён!</p>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>Войдите с новым паролем.</p>
            <button className="ps-btn ps-btn-primary" style={{ width: '100%', padding: '14px 22px', fontSize: 14 }} onClick={() => navigate('/login')}>
              Войти <Icon name="arrow" size={14} />
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>{error}</div>
            )}
            <div>
              <label className="ps-input-label">НОВЫЙ ПАРОЛЬ</label>
              <div style={{ position: 'relative' }}>
                <input className="ps-input" type={showPwd ? 'text' : 'password'} placeholder="Минимум 6 символов" value={pwd} onChange={e => setPwd(e.target.value)} autoComplete="new-password" autoFocus style={{ paddingRight: 44 }} />
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
              {loading ? 'Сохраняем...' : <>Сохранить пароль <Icon name="arrow" size={14} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
