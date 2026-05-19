import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

const INDEX = [
  // Разделы
  { type: 'page', label: 'Главная',            sub: 'Раздел',          icon: 'home',     route: '/dashboard' },
  { type: 'page', label: 'Расписание',          sub: 'Раздел',          icon: 'calendar', route: '/calendar'  },
  { type: 'page', label: 'Домашние задания',    sub: 'Раздел',          icon: 'file',     route: '/homework'  },
  { type: 'page', label: 'Сообщения',           sub: 'Раздел',          icon: 'chat',     route: '/messages'  },
  { type: 'page', label: 'Преподаватели',       sub: 'Раздел',          icon: 'users',    route: '/teachers'  },
  { type: 'page', label: 'Абонементы',          sub: 'Раздел',          icon: 'wallet',   route: '/billing'   },
  { type: 'page', label: 'Профиль',             sub: 'Раздел',          icon: 'user',     route: '/profile'   },
  // Преподаватели
  { type: 'teacher', label: 'Софья Фролова',    sub: 'Французский B1',  icon: 'user',     route: '/teachers'  },
  { type: 'teacher', label: 'Татьяна Кравченко',sub: 'Английский A2+',  icon: 'user',     route: '/teachers'  },
  { type: 'teacher', label: 'Pierre Bouchard',  sub: 'Носитель · Французский', icon: 'user', route: '/teachers' },
  { type: 'teacher', label: 'Лаура Мартин',     sub: 'Испанский',       icon: 'user',     route: '/teachers'  },
  { type: 'teacher', label: 'Иван Шульц',       sub: 'Немецкий',        icon: 'user',     route: '/teachers'  },
  // Домашние задания
  { type: 'hw', label: 'Эссе «Mes rêves»',      sub: 'ДЗ · до пт',     icon: 'file',     route: '/homework'  },
  { type: 'hw', label: 'Listening · BBC News A2',sub: 'ДЗ · до ср',    icon: 'file',     route: '/homework'  },
  { type: 'hw', label: 'Лексика модуля 4',       sub: 'ДЗ · Сдано',     icon: 'file',     route: '/homework'  },
  { type: 'hw', label: 'Past Perfect (упр 1–20)',sub: 'ДЗ · Просрочено',icon: 'file',     route: '/homework'  },
  // Абонементы
  { type: 'sub', label: 'Французский · 8 уроков',sub: 'Абонемент · активный', icon: 'wallet', route: '/billing' },
  { type: 'sub', label: 'Английский · 4 урока',  sub: 'Абонемент · активный', icon: 'wallet', route: '/billing' },
  // Профиль
  { type: 'profile', label: 'Личные данные',    sub: 'Профиль',         icon: 'user',     route: '/profile'   },
  { type: 'profile', label: 'Уведомления',      sub: 'Профиль · настройки', icon: 'bell', route: '/profile'   },
  { type: 'profile', label: 'Смена пароля',     sub: 'Профиль · безопасность', icon: 'shield', route: '/profile' },
]

const TYPE_LABELS = {
  page:    'Разделы',
  teacher: 'Преподаватели',
  hw:      'Домашние задания',
  sub:     'Абонементы',
  profile: 'Профиль',
}

const TYPE_CHIP = {
  page:    { bg: 'var(--purple-soft)',   color: 'var(--purple-deep)' },
  teacher: { bg: 'var(--orange-soft)',   color: 'var(--orange-deep)' },
  hw:      { bg: 'var(--info-soft)',     color: 'var(--info)'        },
  sub:     { bg: 'var(--success-soft)',  color: 'var(--success)'     },
  profile: { bg: 'var(--bg-cream)',      color: 'var(--ink-muted)'   },
}

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--orange-soft)', color: 'var(--orange-deep)', borderRadius: 3, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchModal({ onClose }) {
  const [query,   setQuery]   = useState('')
  const [cursor,  setCursor]  = useState(0)
  const navigate  = useNavigate()
  const inputRef  = useRef(null)
  const listRef   = useRef(null)

  const results = query.trim().length < 1
    ? INDEX.filter(i => i.type === 'page')
    : INDEX.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.sub.toLowerCase().includes(query.toLowerCase())
      )

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setCursor(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  function go(item) {
    navigate(item.route)
    onClose()
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter')     { if (results[cursor]) go(results[cursor]) }
    if (e.key === 'Escape')    { onClose() }
  }

  // Группировка результатов
  const groups = []
  const seen = new Set()
  results.forEach((item, idx) => {
    if (!seen.has(item.type)) {
      seen.add(item.type)
      groups.push({ type: item.type, label: TYPE_LABELS[item.type], items: [] })
    }
    groups[groups.length - 1].items.push({ ...item, idx })
  })

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 580, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>

        {/* Ввод */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-soft)' }}>
          <Icon name="search" size={18} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Поиск по порталу..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontFamily: 'var(--font-body)', color: 'var(--ink)', background: 'transparent' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ border: 'none', background: 'var(--bg-cream)', borderRadius: 6, padding: '2px 8px', fontSize: 12, color: 'var(--ink-muted)', cursor: 'pointer' }}>
              ✕
            </button>
          )}
          <kbd style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: 'var(--ink-muted)', background: 'var(--bg-cream)', flexShrink: 0 }}>Esc</kbd>
        </div>

        {/* Результаты */}
        <div ref={listRef} style={{ overflowY: 'auto', padding: '8px 0' }}>
          {results.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
              Ничего не найдено по запросу «{query}»
            </div>
          )}

          {groups.map(group => (
            <div key={group.type}>
              <div style={{ padding: '6px 20px 4px', fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const chip = TYPE_CHIP[item.type]
                const active = item.idx === cursor
                return (
                  <div
                    key={item.label}
                    data-idx={item.idx}
                    onMouseEnter={() => setCursor(item.idx)}
                    onClick={() => go(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px', cursor: 'pointer',
                      background: active ? 'var(--purple-tint)' : 'transparent',
                      borderLeft: active ? '3px solid var(--purple)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: chip.bg, display: 'grid', placeItems: 'center', color: chip.color, flexShrink: 0 }}>
                      <Icon name={item.icon} size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                        {highlight(item.label, query)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 1 }}>
                        {highlight(item.sub, query)}
                      </div>
                    </div>
                    {active && (
                      <kbd style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: 'var(--ink-muted)', background: '#fff', flexShrink: 0 }}>↵</kbd>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Подсказки */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 18, fontSize: 11, color: 'var(--ink-muted)' }}>
          {[['↑↓', 'навигация'], ['↵', 'перейти'], ['Esc', 'закрыть']].map(([k, l]) => (
            <span key={k} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <kbd style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 10, background: 'var(--bg-cream)' }}>{k}</kbd>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
