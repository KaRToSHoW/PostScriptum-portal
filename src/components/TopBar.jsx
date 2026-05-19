import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Icon from './Icon'

const INDEX = [
  { type: 'page',    label: 'Главная',              sub: 'Раздел',                  icon: 'home',     route: '/dashboard' },
  { type: 'page',    label: 'Расписание',            sub: 'Раздел',                  icon: 'calendar', route: '/calendar'  },
  { type: 'page',    label: 'Домашние задания',      sub: 'Раздел',                  icon: 'file',     route: '/homework'  },
  { type: 'page',    label: 'Сообщения',             sub: 'Раздел',                  icon: 'chat',     route: '/messages'  },
  { type: 'page',    label: 'Преподаватели',         sub: 'Раздел',                  icon: 'users',    route: '/teachers'  },
  { type: 'page',    label: 'Абонементы',            sub: 'Раздел',                  icon: 'wallet',   route: '/billing'   },
  { type: 'page',    label: 'Профиль',               sub: 'Раздел',                  icon: 'user',     route: '/profile'   },
  { type: 'teacher', label: 'Софья Фролова',         sub: 'Преподаватель · Французский', icon: 'user', route: '/teachers' },
  { type: 'teacher', label: 'Татьяна Кравченко',     sub: 'Преподаватель · Английский',  icon: 'user', route: '/teachers' },
  { type: 'teacher', label: 'Pierre Bouchard',       sub: 'Носитель · Французский',      icon: 'user', route: '/teachers' },
  { type: 'teacher', label: 'Лаура Мартин',          sub: 'Преподаватель · Испанский',   icon: 'user', route: '/teachers' },
  { type: 'teacher', label: 'Иван Шульц',            sub: 'Преподаватель · Немецкий',    icon: 'user', route: '/teachers' },
  { type: 'hw',      label: 'Эссе «Mes rêves»',      sub: 'ДЗ · до пт',              icon: 'file',     route: '/homework'  },
  { type: 'hw',      label: 'Listening · BBC News',  sub: 'ДЗ · до ср',              icon: 'file',     route: '/homework'  },
  { type: 'hw',      label: 'Лексика модуля 4',      sub: 'ДЗ · Сдано',              icon: 'file',     route: '/homework'  },
  { type: 'sub',     label: 'Французский · 8 уроков',sub: 'Абонемент · активный',    icon: 'wallet',   route: '/billing'   },
  { type: 'sub',     label: 'Английский · 4 урока',  sub: 'Абонемент · активный',    icon: 'wallet',   route: '/billing'   },
]

const TYPE_COLOR = {
  page:    { bg: 'var(--purple-soft)',  color: 'var(--purple-deep)' },
  teacher: { bg: 'var(--orange-soft)',  color: 'var(--orange-deep)' },
  hw:      { bg: 'var(--info-soft)',    color: 'var(--info)'        },
  sub:     { bg: 'var(--success-soft)', color: 'var(--success)'     },
}

function Highlight({ text, query }) {
  if (!query) return text
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: 'var(--orange-soft)', color: 'var(--orange-deep)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  )
}

export default function TopBar({ title }) {
  const { user, logout } = useApp()
  const navigate  = useNavigate()
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [cursor,  setCursor]  = useState(0)
  const wrapRef   = useRef(null)
  const inputRef  = useRef(null)

  const results = query.trim()
    ? INDEX.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.sub.toLowerCase().includes(query.toLowerCase())
      )
    : INDEX.filter(i => i.type === 'page')

  useEffect(() => { setCursor(0) }, [query])

  // Закрыть при клике вне
  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter')     { if (results[cursor]) { navigate(results[cursor].route); setOpen(false); setQuery('') } }
    if (e.key === 'Escape')    { setOpen(false); setQuery(''); inputRef.current?.blur() }
  }

  function go(item) {
    navigate(item.route)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="ps-top">
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span className="ps-eyebrow">{user?.subtitle}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
          {title}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Поиск — инлайн */}
      <div ref={wrapRef} style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: open ? '#fff' : 'var(--bg-cream)',
          borderRadius: open ? '14px 14px 0 0' : 'var(--r-pill)',
          padding: '8px 14px',
          border: open ? '1px solid var(--border)' : '1px solid transparent',
          borderBottom: open ? '1px solid transparent' : '1px solid transparent',
          transition: 'background .12s, border-radius .12s',
        }}>
          <Icon name="search" size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKey}
            placeholder="Поиск по порталу…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--ink)',
            }}
          />
          {query
            ? <button onClick={() => { setQuery(''); inputRef.current?.focus() }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-muted)', padding: 0, display: 'flex' }}>
                <Icon name="plus" size={12} style={{ transform: 'rotate(45deg)' }} />
              </button>
            : <kbd style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-dim)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 6, background: 'transparent' }}>⌘K</kbd>
          }
        </div>

        {/* Дропдаун */}
        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#fff', borderRadius: '0 0 14px 14px',
            border: '1px solid var(--border)', borderTop: 'none',
            boxShadow: '0 12px 32px rgba(70,62,137,.14)',
            zIndex: 200, maxHeight: 340, overflowY: 'auto',
          }}>
            {results.length === 0 && (
              <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center' }}>
                Ничего не найдено
              </div>
            )}
            {results.map((item, idx) => {
              const c = TYPE_COLOR[item.type] || TYPE_COLOR.page
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setCursor(idx)}
                  onMouseDown={() => go(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer',
                    background: cursor === idx ? 'var(--purple-tint)' : 'transparent',
                    borderLeft: cursor === idx ? '3px solid var(--purple)' : '3px solid transparent',
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, color: c.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={item.icon} size={13} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                      <Highlight text={item.label} query={query} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                      <Highlight text={item.sub} query={query} />
                    </div>
                  </div>
                  {cursor === idx && <Icon name="arrow" size={12} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button style={{ padding: 8, borderRadius: 10, background: 'var(--bg-cream)', color: 'var(--ink-2)', border: 0, position: 'relative', cursor: 'pointer' }}>
        <Icon name="bell" size={16} />
        <span style={{ position: 'absolute', top: 4, right: 5, width: 8, height: 8, background: 'var(--orange)', borderRadius: '50%', border: '1.5px solid #fff' }} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ textAlign: 'right', lineHeight: 1.15 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{user?.subtitle}</div>
        </div>
        <div className="avatar">{user?.initials}</div>
        <button onClick={() => { logout(); navigate('/login') }} title="Выйти" style={{ padding: 8, borderRadius: 10, background: 'var(--bg-cream)', color: 'var(--ink-muted)', border: 0, cursor: 'pointer', display: 'flex' }}>
          <Icon name="logout" size={16} />
        </button>
      </div>
    </div>
  )
}
