import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'

/*
  Подтверждение опасных действий (отмена/завершение урока, удаление) — вместо window.confirm.
  Использование:  if (!(await confirmDialog({ title, text, confirmLabel, danger: true }))) return
*/

const listeners = new Set()

export function confirmDialog({ title = 'Вы уверены?', text = '', confirmLabel = 'Подтвердить', cancelLabel = 'Отмена', danger = false } = {}) {
  // провайдер не смонтирован — не блокируем пользователя молча
  if (listeners.size === 0) return Promise.resolve(window.confirm(text || title))
  return new Promise(resolve => {
    listeners.forEach(fn => fn({ title, text, confirmLabel, cancelLabel, danger, resolve }))
  })
}

export default function ConfirmProvider() {
  const [dlg, setDlg] = useState(null)
  const confirmRef = useRef(null)

  useEffect(() => {
    const fn = d => setDlg(d)
    listeners.add(fn)
    return () => listeners.delete(fn)
  }, [])

  function close(result) {
    dlg?.resolve(result)
    setDlg(null)
  }

  useEffect(() => {
    if (!dlg) return
    confirmRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') close(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  if (!dlg) return null
  const accent = dlg.danger ? 'var(--danger)' : 'var(--purple)'

  return (
    <div
      className="ps-m-pad"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) close(false) }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ps-confirm-title"
        aria-describedby={dlg.text ? 'ps-confirm-text' : undefined}
        className="ps-m-full"
        style={{ width: 420, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dlg.danger ? '#FDECEC' : 'var(--purple-tint)', color: accent }}>
            <Icon name={dlg.danger ? 'warning' : 'check'} size={18} />
          </span>
          <h3 id="ps-confirm-title" className="ps-display" style={{ fontSize: 18, margin: 0 }}>{dlg.title}</h3>
        </div>
        {dlg.text && (
          <p id="ps-confirm-text" style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ink-muted)' }}>{dlg.text}</p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="ps-btn ps-btn-ghost" onClick={() => close(false)}>{dlg.cancelLabel}</button>
          <button
            ref={confirmRef}
            className="ps-btn ps-btn-primary"
            style={dlg.danger ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : undefined}
            onClick={() => close(true)}
          >
            {dlg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
