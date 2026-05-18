import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Icon from './Icon'

export default function TopBar({ title }) {
  const { user, logout } = useApp()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="ps-top">
      {/* Заголовок */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span className="ps-eyebrow">{user?.subtitle}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
          {title}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Поиск */}
      <div className="search">
        <Icon name="search" size={14} />
        <span>Поиск по порталу…</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
          color: 'var(--ink-dim)', border: '1px solid var(--border)',
          padding: '1px 6px', borderRadius: 6,
        }}>⌘K</span>
      </div>

      {/* Уведомления */}
      <button style={{
        padding: 8, borderRadius: 10,
        background: 'var(--bg-cream)', color: 'var(--ink-2)',
        border: 0, position: 'relative', cursor: 'pointer',
      }}>
        <Icon name="bell" size={16} />
        <span style={{
          position: 'absolute', top: 4, right: 5,
          width: 8, height: 8,
          background: 'var(--orange)', borderRadius: '50%',
          border: '1.5px solid #fff',
        }} />
      </button>

      {/* Пользователь */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{user?.subtitle}</div>
        </div>
        <div className="avatar">{user?.initials}</div>
        <button
          onClick={handleLogout}
          title="Выйти"
          style={{
            padding: 8, borderRadius: 10,
            background: 'var(--bg-cream)', color: 'var(--ink-muted)',
            border: 0, cursor: 'pointer', display: 'flex',
          }}
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </div>
  )
}
