import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Icon from './Icon'
import NotificationsBell from './NotificationsBell'
import SearchModal from './SearchModal'

export default function TopBar({ title }) {
  const { user, logout, t, photo } = useApp()
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)

  /* Ctrl/Cmd+K */
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="ps-top">
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span className="ps-eyebrow">{t(user?.subtitle)}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
            {t(title)}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Кнопка-триггер поиска */}
        <button
          onClick={() => setShowSearch(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 14px', borderRadius: 'var(--r-pill)',
            background: 'var(--bg-cream)', border: '1.5px solid var(--border)',
            cursor: 'pointer', color: 'var(--ink-muted)',
            fontSize: 13, fontFamily: 'var(--font-body)',
            flex: 1, maxWidth: 340,
            transition: 'border-color .12s, background .12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-cream)' }}
        >
          <Icon name="search" size={14} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left' }}>{t('Поиск по порталу…')}</span>
          <kbd style={{
            fontSize: 10, fontWeight: 700, color: 'var(--ink-dim)',
            border: '1px solid var(--border)', padding: '1px 6px',
            borderRadius: 6, background: 'transparent', flexShrink: 0,
          }}>⌘K</kbd>
        </button>

        <NotificationsBell />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{t(user?.subtitle)}</div>
          </div>
          <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
            {photo
              ? <img src={photo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : user?.initials
            }
          </div>
          <button onClick={() => { logout(); navigate('/login') }} title={t('Выйти')} style={{ padding: 8, borderRadius: 10, background: 'var(--bg-cream)', color: 'var(--ink-muted)', border: 0, cursor: 'pointer', display: 'flex' }}>
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </>
  )
}
