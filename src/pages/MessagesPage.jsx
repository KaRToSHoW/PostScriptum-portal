import { useState } from 'react'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'

const CONVERSATIONS = [
  {
    id: 1, name: 'Софья Фролова', role: 'Преподаватель · Французский', initials: 'СФ', color: 'var(--purple)',
    online: true, unread: 2,
    lastMsg: 'Анна, не забудьте про эссе — жду до пятницы 🙂',
    lastTime: '18:42',
    msgs: [
      { id: 1, from: 'them', text: 'Добрый день, Анна! Как дела с домашним заданием?', time: '18:30' },
      { id: 2, from: 'me',   text: 'Здравствуйте! Пишу эссе, почти готово — осталось проверить грамматику.', time: '18:35' },
      { id: 3, from: 'them', text: 'Отлично! Обратите внимание на согласование времён в сослагательном наклонении — там была ошибка на прошлом уроке.', time: '18:40' },
      { id: 4, from: 'them', text: 'Анна, не забудьте про эссе — жду до пятницы 🙂', time: '18:42' },
    ],
  },
  {
    id: 2, name: 'Татьяна Кравченко', role: 'Преподаватель · Английский', initials: 'ТК', color: 'var(--orange)',
    online: false, unread: 0,
    lastMsg: 'Увидимся в четверг в 19:00!',
    lastTime: 'вчера',
    msgs: [
      { id: 1, from: 'me',   text: 'Татьяна, можем перенести урок с среды на четверг?', time: '10:00' },
      { id: 2, from: 'them', text: 'Да, конечно! В 19:00 вам удобно?', time: '10:15' },
      { id: 3, from: 'me',   text: 'Отлично, спасибо!', time: '10:16' },
      { id: 4, from: 'them', text: 'Увидимся в четверг в 19:00!', time: '10:17' },
    ],
  },
  {
    id: 3, name: 'Анна Жукова', role: 'Менеджер', initials: 'АЖ', color: 'var(--info)',
    online: true, unread: 1,
    lastMsg: 'Ваш абонемент истекает через 2 недели — продлить?',
    lastTime: '14:20',
    msgs: [
      { id: 1, from: 'them', text: 'Добрый день! Хотела напомнить, что ваш абонемент на французский заканчивается 01.06.', time: '14:18' },
      { id: 2, from: 'them', text: 'Ваш абонемент истекает через 2 недели — продлить?', time: '14:20' },
    ],
  },
]

function Avatar({ name, initials, color, online, size = 44 }) {
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

export default function MessagesPage() {
  const { sideRole } = useApp()
  const [activeId, setActiveId] = useState(1)
  const [text, setText]         = useState('')
  const [convs, setConvs]       = useState(CONVERSATIONS)

  const active = convs.find(c => c.id === activeId)

  function handleSelect(id) {
    setActiveId(id)
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  function handleSend() {
    if (!text.trim()) return
    const msg = { id: Date.now(), from: 'me', text: text.trim(), time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) }
    setConvs(prev => prev.map(c => c.id === activeId
      ? { ...c, msgs: [...c.msgs, msg], lastMsg: msg.text, lastTime: msg.time }
      : c
    ))
    setText('')
  }

  const totalUnread = convs.reduce((s, c) => s + c.unread, 0)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Сообщения" />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', margin: 28, gap: 0, borderRadius: 20, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

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
              {convs.map(c => (
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
                  <Avatar name={c.name} initials={c.initials} color={c.color} online={c.online} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)', flexShrink: 0 }}>{c.lastTime}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{c.role}</div>
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

            {/* Шапка чата */}
            <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={active.name} initials={active.initials} color={active.color} online={active.online} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{active.name}</div>
                <div style={{ fontSize: 12, color: active.online ? 'var(--success)' : 'var(--ink-muted)', fontWeight: 700, marginTop: 1 }}>
                  {active.online ? 'Онлайн' : 'Был(а) недавно'} · {active.role}
                </div>
              </div>
              <button className="ps-btn ps-btn-ghost ps-btn-sm"><Icon name="calendar" size={14} /> Записаться</button>
            </div>

            {/* Сообщения */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {active.msgs.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 10 }}>
                  {m.from === 'them' && (
                    <Avatar name={active.name} initials={active.initials} color={active.color} online={false} size={32} />
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
            </div>

            {/* Ввод */}
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
          </div>
        </div>
      </main>
    </div>
  )
}
