import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { notificationsApi } from '../api/notifications'
import { playNotificationSound } from '../lib/notificationSound'
import { subscribeToPush } from '../lib/webPush'

const TYPE_ICON = {
  LESSON_REMINDER:       { icon: 'calendar', color: 'var(--purple)' },
  HOMEWORK_DUE:          { icon: 'file',     color: 'var(--orange-deep)' },
  PAYMENT_DUE:           { icon: 'wallet',   color: 'var(--warning)' },
  PAYMENT_OVERDUE:       { icon: 'warning',  color: 'var(--danger)' },
  NEW_MESSAGE:           { icon: 'chat',     color: 'var(--info)' },
  SUBSCRIPTION_EXPIRING: { icon: 'wallet',   color: 'var(--orange-deep)' },
  SYSTEM:                { icon: 'bell',     color: 'var(--ink-muted)' },
}

function timeAgo(ts) {
  if (!ts) return ''
  const then = new Date(ts).getTime()
  const diff = Math.max(0, Date.now() - then)
  const min = Math.floor(diff / 60000)
  if (min < 1)  return 'только что'
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h} ч`
  const d = Math.floor(h / 24)
  return `${d} дн`
}

const NOTIF_SUPPORTED = typeof window !== 'undefined' && 'Notification' in window

export default function NotificationsBell() {
  const navigate = useNavigate()
  const [open, setOpen]     = useState(false)
  const [items, setItems]   = useState([])
  const [unread, setUnread] = useState(0)
  const [perm, setPerm]     = useState(NOTIF_SUPPORTED ? Notification.permission : 'unsupported')
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('ps_notif_sound') !== 'off')
  const wrapRef = useRef(null)
  const seenIdRef = useRef(null)   // максимальный id, который уже показывали всплывашкой
  const soundRef  = useRef(soundOn)  // чтобы таймер опроса видел актуальное значение

  useEffect(() => { soundRef.current = soundOn }, [soundOn])
  function toggleSound() {
    setSoundOn(v => {
      const nv = !v
      localStorage.setItem('ps_notif_sound', nv ? 'on' : 'off')
      if (nv) playNotificationSound()   // проиграть образец при включении
      return nv
    })
  }

  // Звук + нативная всплывашка браузера для новых уведомлений (пока вкладка открыта)
  function maybeNotify(list) {
    const maxId = list.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0)
    const first = seenIdRef.current === null
    const prevSeen = seenIdRef.current ?? maxId
    seenIdRef.current = Math.max(prevSeen, maxId)
    if (first) return   // первый заход — просто запоминаем базу, не спамим старым

    const fresh = list
      .filter(n => (Number(n.id) || 0) > prevSeen && !n.isRead)
      .sort((a, b) => a.id - b.id)
    if (fresh.length === 0) return

    // звук — независимо от разрешения на всплывашки
    if (soundRef.current) playNotificationSound()

    // системная всплывашка — только если пользователь дал разрешение
    if (!NOTIF_SUPPORTED || Notification.permission !== 'granted') return
    fresh.forEach(n => {
      try {
        const notif = new Notification(n.title || 'Post Scriptum', {
          body: n.body || '', icon: '/ps-logo.jpg', tag: `ps-${n.id}`,
        })
        notif.onclick = () => { window.focus(); if (n.link) navigate(n.link); notif.close() }
      } catch { /* браузер отклонил */ }
    })
  }

  function enableBrowserNotifications() {
    if (!NOTIF_SUPPORTED) return
    Notification.requestPermission().then(p => {
      setPerm(p)
      if (p === 'granted') subscribeToPush().catch(() => {})   // пуши при закрытом сайте
    })
  }

  async function load() {
    try {
      const [list, count] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount(),
      ])
      setItems(list ?? [])
      setUnread(count?.count ?? 0)
      maybeNotify(list ?? [])
    } catch { /* бэкенд недоступен — тихо */ }
  }

  useEffect(() => {
    load()
    // если разрешение уже выдано — убеждаемся, что подписка на пуш зарегистрирована
    if (NOTIF_SUPPORTED && Notification.permission === 'granted') subscribeToPush().catch(() => {})
    const t = setInterval(load, 30000)   // опрос раз в 30с
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function markAll() {
    try { await notificationsApi.markAllRead() } catch {}
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
  }

  async function openItem(n) {
    if (!n.isRead) {
      try { await notificationsApi.markRead(n.id) } catch {}
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
      setUnread(u => Math.max(0, u - 1))
    }
    if (n.link) navigate(n.link)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ padding: 8, borderRadius: 10, background: 'var(--bg-cream)', color: 'var(--ink-2)', border: 0, position: 'relative', cursor: 'pointer' }}
      >
        <Icon name="bell" size={16} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 1, right: 1, minWidth: 16, height: 16, padding: '0 4px',
            background: 'var(--orange)', color: '#fff', borderRadius: 999, fontSize: 9, fontWeight: 800,
            display: 'grid', placeItems: 'center', border: '1.5px solid #fff',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="ps-notif-pop" style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 360,
          background: '#fff', borderRadius: 16, border: '1px solid var(--border)',
          boxShadow: '0 12px 40px rgba(70,62,137,.18)', zIndex: 300, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>Уведомления</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {unread > 0 && (
                <button onClick={markAll} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>
                  Прочитать все
                </button>
              )}
              <button
                onClick={toggleSound}
                title={soundOn ? 'Звук уведомлений включён' : 'Звук уведомлений выключен'}
                style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: soundOn ? 'var(--purple)' : 'var(--ink-dim)', padding: 0 }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  {soundOn
                    ? <><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
                    : <><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Предложение включить всплывашки браузера */}
          {NOTIF_SUPPORTED && perm === 'default' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--purple-tint)', borderBottom: '1px solid var(--border-soft)' }}>
              <Icon name="bell" size={15} style={{ color: 'var(--purple-deep)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>Показывать уведомления браузера</span>
              <button onClick={enableBrowserNotifications} className="ps-btn ps-btn-primary ps-btn-sm" style={{ flexShrink: 0 }}>Включить</button>
            </div>
          )}
          {NOTIF_SUPPORTED && perm === 'denied' && (
            <div style={{ padding: '10px 16px', background: 'var(--danger-soft)', borderBottom: '1px solid var(--border-soft)', fontSize: 11.5, color: '#7A322C', lineHeight: 1.4 }}>
              Уведомления браузера заблокированы. Разрешите их в настройках сайта (значок 🔒 в адресной строке).
            </div>
          )}

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {items.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13 }}>
                Нет уведомлений
              </div>
            )}
            {items.map(n => {
              const cfg = TYPE_ICON[n.type] || TYPE_ICON.SYSTEM
              return (
                <div
                  key={n.id}
                  onClick={() => openItem(n)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer',
                    background: n.isRead ? '#fff' : 'var(--purple-tint)',
                    borderBottom: '1px solid var(--border-soft)',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: cfg.color + '22', color: cfg.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name={cfg.icon} size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>}
                    <div style={{ fontSize: 10, color: 'var(--ink-dim)', fontWeight: 700, marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0, marginTop: 4 }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
