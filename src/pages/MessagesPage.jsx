import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'
import { messagesApi } from '../api/messages'
import { currentEmail } from '../api/session'

const LANG_COLORS = ['var(--purple)','var(--orange)','var(--success)','var(--info)','var(--warning)']

function Avatar({ initials, color, online, size = 44 }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color + '22', border: `2px solid ${color}44`,
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: size * 0.3, color,
      }}>
        {initials}
      </div>
      {online && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--success)', border: '2px solid var(--bg-cream)',
        }} />
      )}
    </div>
  )
}

function formatTime(sentAt) {
  if (!sentAt) return ''
  try {
    return new Date(sentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function mapMessages(msgs) {
  const myEmail = currentEmail()
  return msgs.map(m => ({
    id:    m.id,
    text:  m.body,
    time:  formatTime(m.sentAt),
    from:  myEmail && m.senderEmail === myEmail ? 'me' : 'them',
  }))
}

export default function MessagesPage() {
  const { sideRole } = useApp()
  const location  = useLocation()
  const [activeId, setActiveId] = useState(null)
  const [text, setText]         = useState('')
  const [convs, setConvs]       = useState([])
  const [search, setSearch]     = useState('')
  const bottomRef  = useRef(null)
  const pollRef    = useRef(null)

  // ---------- helpers ----------

  const loadConversations = useCallback(() => {
    return messagesApi.conversations()
      .then(data => {
        const mapped = data.map((c, i) => ({
          id:       c.id,
          name:     c.name,
          initials: c.initials ?? c.name[0],
          color:    LANG_COLORS[i % LANG_COLORS.length],
          online:   false,
          role:     c.role ?? '',
          lastMsg:  c.lastMsg ?? '',
          lastTime: c.lastTs ? formatTime(c.lastTs) : '',
          unread:   c.unread ?? 0,
          msgs:     [],
        }))
        return mapped
      })
  }, [])

  const loadThread = useCallback((id) => {
    return messagesApi.thread(id)
      .then(data => mapMessages(data))
  }, [])

  // ---------- on mount: load conversations, auto-select first ----------

  useEffect(() => {
    // если переход с другой страницы несёт намерение открыть конкретный чат —
    // не перетирай выбор первым диалогом, второй эффект ниже сам разберётся
    const hasNavIntent = !!(location.state?.userId || location.state?.teacherName || location.state?.conversationId)
    loadConversations()
      .then(mapped => {
        setConvs(mapped)
        if (!hasNavIntent && mapped.length > 0) setActiveId(mapped[0].id)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadConversations])

  // ---------- location.state: navigate from another page ----------

  const selectConversation = useCallback((conversationId) => {
    // reload conversations + the thread together, so an already-active
    // conversation (activeId unchanged) still gets its messages refilled
    return Promise.all([loadConversations(), loadThread(conversationId)])
      .then(([mapped, msgs]) => {
        setConvs(mapped.map(c => c.id === conversationId ? { ...c, msgs, unread: 0 } : c))
        setActiveId(conversationId)
        messagesApi.markRead(conversationId).catch(() => {})
      })
  }, [loadConversations, loadThread])

  useEffect(() => {
    const state = location.state ?? {}
    const { teacherName, teacherInitials, teacherColor, teacherRole, userId, conversationId } = state

    if (!teacherName && !userId && !conversationId) return

    if (conversationId) {
      selectConversation(conversationId).catch(() => {})
      return
    }

    if (userId) {
      // start or get existing conversation by userId
      messagesApi.start(userId)
        .then(({ conversationId }) => selectConversation(conversationId))
        .catch(() => {})
      return
    }

    // no userId — try to match by name in the existing list
    if (teacherName) {
      setConvs(prev => {
        const existing = prev.find(c => c.name === teacherName)
        if (existing) {
          setActiveId(existing.id)
          return prev
        }
        // create a placeholder conversation (will be replaced once API is available)
        const newConv = {
          id:       `tmp-${Date.now()}`,
          name:     teacherName,
          role:     teacherRole ?? '',
          initials: teacherInitials ?? teacherName.split(' ').map(s => s[0]).join('').slice(0, 2),
          color:    teacherColor ?? 'var(--purple)',
          online:   false,
          unread:   0,
          lastMsg:  '',
          lastTime: '',
          msgs:     [],
        }
        setActiveId(newConv.id)
        return [newConv, ...prev]
      })
    }
  }, [location.state, loadConversations, selectConversation])

  // ---------- load thread + markRead when active conversation changes ----------

  useEffect(() => {
    if (!activeId) return

    loadThread(activeId)
      .then(msgs => {
        setConvs(prev => prev.map(c =>
          c.id === activeId ? { ...c, msgs, unread: 0 } : c
        ))
      })
      .catch(() => {})

    // mark as read silently
    messagesApi.markRead(activeId).catch(() => {})
  }, [activeId, loadThread])

  // ---------- polling every 5 seconds ----------

  useEffect(() => {
    if (!activeId) return

    function poll() {
      loadThread(activeId)
        .then(msgs => {
          setConvs(prev => prev.map(c =>
            c.id === activeId ? { ...c, msgs } : c
          ))
        })
        .catch(() => {})

      loadConversations()
        .then(fresh => {
          setConvs(prev => fresh.map(fc => {
            const existing = prev.find(pc => pc.id === fc.id)
            // merge: keep loaded msgs for the active conv, take fresh unread for others
            if (!existing) return fc
            return {
              ...fc,
              color: existing.color, // keep stable color assignment
              msgs:  existing.id === activeId ? existing.msgs : existing.msgs,
              unread: fc.id === activeId ? 0 : fc.unread,
            }
          }))
        })
        .catch(() => {})
    }

    pollRef.current = setInterval(poll, 5000)
    return () => clearInterval(pollRef.current)
  }, [activeId, loadThread, loadConversations])

  // ---------- auto-scroll when messages change ----------

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, convs])

  // ---------- select conversation ----------

  function handleSelect(id) {
    if (id === activeId) return
    setActiveId(id)
  }

  // ---------- send message ----------

  function handleSend() {
    if (!text.trim() || !activeId) return
    const body = text.trim()
    setText('')
    messagesApi.send(activeId, body)
      .then(() => loadThread(activeId))
      .then(msgs => {
        setConvs(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, msgs, lastMsg: body, lastTime: formatTime(new Date().toISOString()) }
            : c
        ))
      })
      .catch(() => {})
  }

  // ---------- derived state ----------

  const active = convs.find(c => c.id === activeId)

  const filteredConvs = convs.filter(c => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.role ?? '').toLowerCase().includes(q)
    )
  })

  const totalUnread = convs.reduce((s, c) => s + (c.unread ?? 0), 0)

  // ---------- render ----------

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Сообщения" />

        <div style={{ flex: 1, display: 'flex', margin: 28, gap: 0, borderRadius: 20, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

          {/* Список диалогов */}
          <div style={{ width: 300, background: '#fff', borderRight: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 className="ps-display" style={{ fontSize: 18, margin: 0 }}>Чаты</h3>
                {totalUnread > 0 && <span className="ps-chip ps-chip-orange">{totalUnread}</span>}
              </div>
              <div style={{ position: 'relative' }}>
                <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск..."
                  style={{
                    width: '100%', padding: '8px 10px 8px 32px', borderRadius: 10,
                    border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)',
                    fontSize: 13, color: 'var(--ink)', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {convs.length === 0 && (
                <div style={{ padding: '30px 18px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
                  Нет диалогов
                </div>
              )}
              {convs.length > 0 && filteredConvs.length === 0 && (
                <div style={{ padding: '30px 18px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
                  Ничего не найдено
                </div>
              )}
              {filteredConvs.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  style={{
                    display: 'flex', gap: 12, padding: '14px 18px', cursor: 'pointer',
                    background: activeId === c.id ? 'var(--purple-tint)' : 'transparent',
                    borderLeft: activeId === c.id ? '3px solid var(--purple)' : '3px solid transparent',
                    transition: 'background .12s',
                  }}
                >
                  <Avatar initials={c.initials} color={c.color} online={c.online} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)', flexShrink: 0 }}>{c.lastTime}</span>
                    </div>
                    {c.role ? (
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{c.role}</div>
                    ) : null}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {c.lastMsg}
                      </span>
                      {c.unread > 0 && (
                        <span style={{ background: 'var(--purple)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999, flexShrink: 0, marginLeft: 6 }}>
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Чат */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-cream-soft)', minWidth: 0 }}>

            {!active && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                {convs.length === 0 ? 'Нет диалогов' : 'Выберите чат'}
              </div>
            )}

            {/* Шапка */}
            {active && (
              <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar initials={active.initials} color={active.color} online={active.online} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{active.name}</div>
                  <div style={{ fontSize: 12, color: active.online ? 'var(--success)' : 'var(--ink-muted)', fontWeight: 700, marginTop: 1 }}>
                    {active.online ? 'Онлайн' : 'Был(а) недавно'}{active.role ? ` · ${active.role}` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Сообщения */}
            {active && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {active.msgs.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)', fontSize: 13, paddingTop: 40 }}>
                    Нет сообщений
                  </div>
                )}
                {active.msgs.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 10 }}>
                    {m.from === 'them' && (
                      <Avatar initials={active.initials} color={active.color} online={false} size={32} />
                    )}
                    <div style={{ maxWidth: '65%' }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: m.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: m.from === 'me' ? 'var(--purple)' : '#fff',
                        color: m.from === 'me' ? '#fff' : 'var(--ink)',
                        fontSize: 14, lineHeight: 1.5, fontWeight: 500,
                        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                      }}>
                        {m.text}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left' }}>
                        {m.time}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Ввод */}
            {active && (
              <div style={{ padding: '14px 24px', background: '#fff', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Написать сообщение..."
                  rows={1}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 14,
                    border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)',
                    fontSize: 14, color: 'var(--ink)', resize: 'none', outline: 'none',
                    fontFamily: 'var(--font-body)', lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: 12, border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
                    background: text.trim() ? 'var(--purple)' : 'var(--purple-soft)',
                    color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0,
                    transition: 'background .15s',
                  }}
                >
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
