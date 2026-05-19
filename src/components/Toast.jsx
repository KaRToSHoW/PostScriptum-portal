import { useState, useEffect } from 'react'

const listeners = new Set()

export function toast(msg, type = 'success') {
  listeners.forEach(fn => fn({ msg, type, id: Date.now() + Math.random() }))
}

export default function ToastProvider() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const fn = item => {
      setItems(prev => [...prev, item])
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== item.id)), 3000)
    }
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  if (!items.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {items.map(t => (
        <div key={t.id} style={{
          padding: '12px 20px', borderRadius: 14,
          background: t.type === 'error' ? 'var(--danger)' : t.type === 'warning' ? 'var(--orange-deep)' : '#1F1B3A',
          color: '#fff', fontSize: 13, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,.22)',
          maxWidth: 340,
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
