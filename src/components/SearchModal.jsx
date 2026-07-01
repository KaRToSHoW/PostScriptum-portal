import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useApp } from '../context/AppContext'
import { api } from '../api/client'

/* ── Статичная навигация по роли ─────────────────────────────── */
const PAGES = {
  student: [
    { label: 'Главная',             icon: 'home',     route: '/dashboard' },
    { label: 'Расписание',          icon: 'calendar', route: '/calendar'  },
    { label: 'Домашние задания',    icon: 'file',     route: '/homework'  },
    { label: 'Сообщения',           icon: 'chat',     route: '/messages'  },
    { label: 'Преподаватели',       icon: 'users',    route: '/teachers'  },
    { label: 'Абонементы',          icon: 'wallet',   route: '/billing'   },
    { label: 'Профиль',             icon: 'user',     route: '/profile'   },
  ],
  teacher: [
    { label: 'Главная',             icon: 'home',     route: '/dashboard' },
    { label: 'Расписание',          icon: 'calendar', route: '/calendar'  },
    { label: 'Мои ученики',         icon: 'users',    route: '/students'  },
    { label: 'Домашние задания',    icon: 'file',     route: '/homework'  },
    { label: 'Сообщения',           icon: 'chat',     route: '/messages'  },
    { label: 'Профиль',             icon: 'user',     route: '/profile'   },
  ],
  admin: [
    { label: 'Дашборд',             icon: 'home',     route: '/dashboard'    },
    { label: 'Ученики',             icon: 'users',    route: '/students'     },
    { label: 'Преподаватели',       icon: 'users',    route: '/teachers'     },
    { label: 'Заявки и сотрудники', icon: 'inbox',    route: '/admin/roles'  },
    { label: 'Финансы',             icon: 'wallet',   route: '/admin/finance'},
    { label: 'Сообщения',           icon: 'chat',     route: '/messages'     },
  ],
  manager: [
    { label: 'Дашборд',             icon: 'home',     route: '/dashboard' },
    { label: 'Ученики',             icon: 'users',    route: '/students'  },
    { label: 'Преподаватели',       icon: 'users',    route: '/teachers'  },
    { label: 'Сообщения',           icon: 'chat',     route: '/messages'  },
  ],
}

const HW_STATUS = {
  ASSIGNED: 'Назначено', SUBMITTED: 'Сдано',
  REVIEWED: 'Проверено', OVERDUE: 'Просрочено',
}

/* ── Недавние (localStorage) ─────────────────────────────────── */
const RECENT_KEY = 'ps_search_recent'

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}

function saveRecent(item) {
  const clean = { label: item.label, sub: item.sub, icon: item.icon, route: item.route }
  const prev = loadRecent().filter(r => r.route !== clean.route || r.label !== clean.label)
  localStorage.setItem(RECENT_KEY, JSON.stringify([clean, ...prev].slice(0, 5)))
}

/* ── Подсветка совпадения ────────────────────────────────────── */
function Hl({ text = '', query = '' }) {
  if (!query || !text) return <>{text}</>
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return <>{text}</>
  return <>
    {text.slice(0, i)}
    <mark style={{ background: 'rgba(246,173,61,.3)', color: 'var(--orange-deep)', borderRadius: 2, padding: '0 1px' }}>
      {text.slice(i, i + query.length)}
    </mark>
    {text.slice(i + query.length)}
  </>
}

/* ── Одна строка результата ──────────────────────────────────── */
const TYPE_STYLE = {
  page:     { bg: 'var(--purple-soft)',  color: 'var(--purple-deep)' },
  recent:   { bg: 'var(--bg-cream)',     color: 'var(--ink-muted)'   },
  student:  { bg: 'var(--orange-soft)',  color: 'var(--orange-deep)' },
  teacher:  { bg: 'var(--info-soft)',    color: 'var(--info)'        },
  homework: { bg: 'var(--success-soft)', color: 'var(--success)'     },
}

function ResultRow({ item, active, query, onHover, onClick }) {
  const ref = useRef(null)
  const s = TYPE_STYLE[item.type] ?? TYPE_STYLE.page

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const showInitials = item.type === 'student' || item.type === 'teacher'
  const initials = item.label.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      ref={ref}
      onMouseEnter={onHover}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 20px', cursor: 'pointer',
        background: active ? 'var(--purple-tint)' : 'transparent',
        borderLeft: `3px solid ${active ? 'var(--purple)' : 'transparent'}`,
        transition: 'background .07s',
      }}
    >
      {/* Иконка / инициалы */}
      <div style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0,
        background: active ? (s.color + '22') : s.bg,
        color: s.color,
        display: 'grid', placeItems: 'center',
        fontSize: showInitials ? 12 : 14,
        fontWeight: 800,
      }}>
        {showInitials
          ? initials
          : <Icon name={item.icon} size={16} />
        }
      </div>

      {/* Текст */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 800,
          color: active ? 'var(--purple-deep)' : 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <Hl text={item.label} query={query} />
        </div>
        {item.sub && (
          <div style={{
            fontSize: 12, color: 'var(--ink-muted)', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.sub}
          </div>
        )}
      </div>

      {/* Enter-подсказка при активном */}
      {active && (
        <kbd style={{
          flexShrink: 0, border: '1px solid var(--border)',
          borderRadius: 5, padding: '2px 7px', fontSize: 10,
          color: 'var(--ink-muted)', background: '#fff',
        }}>↵</kbd>
      )}
    </div>
  )
}

/* ── Основной компонент ──────────────────────────────────────── */
export default function SearchModal({ onClose }) {
  const { role } = useApp()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [apiData, setApiData] = useState(null)
  const [recent,  setRecent]  = useState(loadRecent)
  const [cursor,  setCursor]  = useState(0)

  const pages = PAGES[role] ?? PAGES.student

  /* Фокус при открытии */
  useEffect(() => { inputRef.current?.focus() }, [])

  /* Дебаунс API */
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setApiData(null); setLoading(false); return }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(`/api/search?q=${encodeURIComponent(q)}`)
        setApiData(data ?? {})
      } catch { setApiData({}) }
      finally  { setLoading(false) }
    }, 240)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => { setCursor(0) }, [query, apiData])

  /* Строим секции */
  const { sections, flat } = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sections = []

    if (!q) {
      /* Пустой запрос: недавние + быстрый переход */
      if (recent.length > 0) {
        sections.push({
          id: 'recent', label: 'Недавние',
          items: recent.map(r => ({ ...r, type: 'recent' })),
        })
      }
      sections.push({
        id: 'nav', label: 'Быстрый переход',
        items: pages.map(p => ({ ...p, type: 'page', sub: 'Раздел' })),
      })
    } else {
      /* Есть запрос: страницы + API */
      const matchedPages = pages
        .filter(p => p.label.toLowerCase().includes(q))
        .map(p => ({ ...p, type: 'page', sub: 'Раздел' }))
      if (matchedPages.length) sections.push({ id: 'nav', label: 'Разделы', items: matchedPages })

      if (apiData) {
        const { students, teachers, homework } = apiData

        if (students?.length) {
          sections.push({
            id: 'students', label: 'Ученики',
            items: students.map(s => ({
              type: 'student', icon: 'user',
              label: s.name, sub: s.langs || 'Ученик',
              route: '/students', id: s.id,
            })),
          })
        }
        if (teachers?.length) {
          sections.push({
            id: 'teachers', label: 'Преподаватели',
            items: teachers.map(t => ({
              type: 'teacher', icon: 'user',
              label: t.name, sub: t.langs || 'Преподаватель',
              route: '/teachers', id: t.id,
            })),
          })
        }
        if (homework?.length) {
          sections.push({
            id: 'homework', label: 'Домашние задания',
            items: homework.map(h => ({
              type: 'homework', icon: 'file',
              label: h.title,
              sub: [HW_STATUS[h.status] ?? h.status, h.student].filter(Boolean).join(' · '),
              route: '/homework', id: h.id,
            })),
          })
        }
      }
    }

    const flat = sections.flatMap(s => s.items)
    return { sections, flat }
  }, [query, pages, recent, apiData])

  function go(item) {
    saveRecent(item)
    setRecent(loadRecent())
    navigate(item.route)
    onClose()
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter')     { if (flat[cursor]) go(flat[cursor]) }
    if (e.key === 'Escape')    { onClose() }
  }

  const isEmptyState = query.trim().length >= 2 && !loading && flat.length === 0

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 100,
        background: 'rgba(20,16,48,.55)', backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        width: 640, background: 'var(--bg-cream)',
        borderRadius: 22, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(20,16,48,.3)',
        maxHeight: 'calc(100vh - 160px)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Инпут ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '15px 20px', background: '#fff',
          borderBottom: '1.5px solid var(--border-soft)',
        }}>
          {loading
            ? <div style={{
                width: 20, height: 20, flexShrink: 0,
                border: '2.5px solid var(--purple-soft)',
                borderTopColor: 'var(--purple)',
                borderRadius: '50%',
                animation: 'ps-spin 0.65s linear infinite',
              }} />
            : <Icon name="search" size={20} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Поиск по порталу..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 17, fontFamily: 'var(--font-body)', color: 'var(--ink)',
            }}
          />
          {query
            ? <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                style={{
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  padding: '4px 10px', borderRadius: 8,
                  background: 'var(--bg-cream)', color: 'var(--ink-muted)',
                  fontSize: 12, fontWeight: 700,
                }}
              >Очистить</button>
            : <kbd style={{
                flexShrink: 0, border: '1px solid var(--border)',
                borderRadius: 7, padding: '3px 9px', fontSize: 11,
                color: 'var(--ink-muted)', background: 'var(--bg-cream)',
              }}>Esc</kbd>
          }
        </div>

        {/* ── Результаты ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>

          {/* Пусто */}
          {isEmptyState && (
            <div style={{ padding: '44px 24px', textAlign: 'center', color: 'var(--ink-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>Ничего не найдено</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>по запросу «{query}»</div>
            </div>
          )}

          {sections.map((section, si) => (
            <div key={section.id}>
              {/* Заголовок секции */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: si === 0 ? '10px 20px 5px' : '14px 20px 5px',
                borderTop: si > 0 ? '1px solid var(--border-soft)' : 'none',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                  textTransform: 'uppercase', color: 'var(--ink-muted)',
                }}>{section.label}</span>
                {section.id === 'recent' && (
                  <button
                    onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }}
                    style={{
                      marginLeft: 4, fontSize: 9, fontWeight: 700,
                      color: 'var(--ink-muted)', background: 'none',
                      border: 'none', cursor: 'pointer', textDecoration: 'underline',
                      padding: 0,
                    }}
                  >очистить</button>
                )}
              </div>

              {section.items.map((item) => {
                const globalIdx = flat.indexOf(item)
                return (
                  <ResultRow
                    key={`${item.type}-${item.label}-${item.route}`}
                    item={item}
                    active={globalIdx === cursor}
                    query={query}
                    onHover={() => setCursor(globalIdx)}
                    onClick={() => go(item)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* ── Подсказки ── */}
        <div style={{
          display: 'flex', gap: 20, padding: '10px 20px',
          borderTop: '1.5px solid var(--border-soft)',
          background: '#fff', fontSize: 11, color: 'var(--ink-muted)',
        }}>
          {[['↑↓', 'навигация'], ['↵', 'перейти'], ['Esc', 'закрыть']].map(([k, l]) => (
            <span key={k} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <kbd style={{
                border: '1px solid var(--border)', borderRadius: 4,
                padding: '1px 6px', fontSize: 10, background: 'var(--bg-cream)',
              }}>{k}</kbd>
              {l}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.55 }}>
            {flat.length > 0 ? `${flat.length} результатов` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
