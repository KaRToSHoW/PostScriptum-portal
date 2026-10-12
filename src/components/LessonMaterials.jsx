import { useState, useEffect, useCallback, useRef } from 'react'
import Icon from './Icon'
import { toast } from './Toast'
import { confirmDialog } from './ConfirmDialog'
import { lessonMaterialsApi } from '../api/lessonMaterials'
import { uploadFile, fileUrl } from '../api/files'
import { fmtShortDateTime } from '../lib/time'

/*
  Материалы занятия: список + (для преподавателя) загрузка файлов и добавление ссылок.
  Используется в конференции (тёмная тема, dark) и в расписании (окно «Материалы урока»).
  onChange — вызывается после добавления/удаления (конференция оповещает остальных участников).
*/

const MAX_MB = 25

const EXT_ICON = [
  { re: /\.(pdf)$/i,                         label: 'PDF', color: '#D9534F' },
  { re: /\.(docx?|odt|rtf)$/i,               label: 'DOC', color: '#3B6FD8' },
  { re: /\.(pptx?|odp|key)$/i,               label: 'PPT', color: '#E07B39' },
  { re: /\.(xlsx?|ods|csv)$/i,               label: 'XLS', color: '#3E9B5C' },
  { re: /\.(png|jpe?g|gif|webp|svg|heic)$/i, label: 'IMG', color: '#9B59B6' },
  { re: /\.(mp3|wav|ogg|m4a|flac)$/i,        label: 'AUD', color: '#1E9AA8' },
  { re: /\.(mp4|mov|webm|mkv|avi)$/i,        label: 'VID', color: '#C0392B' },
  { re: /\.(zip|rar|7z)$/i,                  label: 'ZIP', color: '#7F8C8D' },
]

function badgeFor(m) {
  if (m.kind === 'LINK') {
    if (/youtu\.?be/i.test(m.url)) return { label: 'YT', color: '#E62117' }
    return { label: 'URL', color: '#6C63C4' }
  }
  return EXT_ICON.find(e => e.re.test(m.title) || e.re.test(m.url)) ?? { label: 'FILE', color: '#6C63C4' }
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, '') } catch { return '' }
}

export default function LessonMaterials({ lessonId, dark = false, onChange, refreshKey = 0 }) {
  const [items, setItems]         = useState(null)
  const [canManage, setCanManage] = useState(false)
  const [error, setError]         = useState(null)
  const [busy, setBusy]           = useState(false)
  const [drag, setDrag]           = useState(false)
  const [linkOpen, setLinkOpen]   = useState(false)
  const [linkUrl, setLinkUrl]     = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const fileRef = useRef(null)

  const c = dark
    ? { text: '#fff', muted: 'rgba(255,255,255,.6)', card: 'rgba(255,255,255,.06)', border: 'rgba(255,255,255,.12)', input: 'rgba(255,255,255,.08)', accent: '#A9A3F0' }
    : { text: 'var(--ink)', muted: 'var(--ink-muted)', card: 'var(--bg-cream-soft)', border: 'var(--border-soft)', input: '#fff', accent: 'var(--purple)' }

  const load = useCallback(() => {
    lessonMaterialsApi.list(lessonId)
      .then(d => { setItems(d?.items ?? []); setCanManage(!!d?.canManage); setError(null) })
      .catch(e => { setItems([]); setError(e.message) })
  }, [lessonId])

  useEffect(() => { load() }, [load, refreshKey])

  async function addFiles(fileList) {
    const files = [...(fileList || [])]
    if (!files.length) return
    const tooBig = files.filter(f => f.size > MAX_MB * 1024 * 1024)
    if (tooBig.length) toast(`Файлы больше ${MAX_MB} МБ пропущены: ${tooBig.map(f => f.name).join(', ')}`, 'warning')
    setBusy(true)
    try {
      for (const f of files.filter(f => f.size <= MAX_MB * 1024 * 1024)) {
        const up = await uploadFile(f, 'MATERIAL')
        await lessonMaterialsApi.add(lessonId, { kind: 'FILE', title: f.name, url: up.url, size: f.size })
      }
      load()
      onChange?.()
    } catch (e) {
      toast(e.message || 'Не удалось загрузить файл', 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function addLink(e) {
    e?.preventDefault()
    let url = linkUrl.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    setBusy(true)
    try {
      await lessonMaterialsApi.add(lessonId, { kind: 'LINK', title: linkTitle.trim() || hostOf(url) || url, url })
      setLinkUrl(''); setLinkTitle(''); setLinkOpen(false)
      load()
      onChange?.()
    } catch (err) {
      toast(err.message || 'Не удалось добавить ссылку', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(m) {
    const ok = await confirmDialog({ title: 'Удалить материал?', text: `«${m.title}» пропадёт у всех участников урока.`, confirmLabel: 'Удалить', danger: true })
    if (!ok) return
    try {
      await lessonMaterialsApi.remove(lessonId, m.id)
      load()
      onChange?.()
    } catch (e) {
      toast(e.message || 'Не удалось удалить', 'error')
    }
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.input, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {canManage && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            style={{
              border: `1.5px dashed ${drag ? c.accent : c.border}`, borderRadius: 14, padding: '14px 12px',
              background: drag ? (dark ? 'rgba(169,163,240,.12)' : 'var(--purple-tint)') : 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', transition: 'all .15s',
            }}
          >
            <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.4 }}>
              {busy ? 'Загрузка…' : <>Перетащите файлы сюда<br />PDF, презентации, аудио, картинки — до {MAX_MB} МБ</>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" className="ps-btn ps-btn-sm ps-btn-primary" disabled={busy} onClick={() => fileRef.current?.click()}>
                <Icon name="upload" size={13} /> Файл
              </button>
              <button type="button" className="ps-btn ps-btn-sm ps-btn-outline" disabled={busy} onClick={() => setLinkOpen(o => !o)}
                style={dark ? { color: '#fff', borderColor: 'rgba(255,255,255,.3)', background: 'transparent' } : undefined}>
                <Icon name="globe" size={13} /> Ссылка
              </button>
            </div>
            <input ref={fileRef} type="file" multiple hidden onChange={e => addFiles(e.target.files)} />
          </div>

          {linkOpen && (
            <form onSubmit={addLink} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 12, background: c.card, border: `1px solid ${c.border}` }}>
              <input autoFocus value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://… (видео, документ, упражнение)" aria-label="Адрес ссылки" style={inputStyle} />
              <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Название (необязательно)" aria-label="Название ссылки" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="ps-btn ps-btn-sm ps-btn-ghost" onClick={() => setLinkOpen(false)} style={dark ? { color: '#fff' } : undefined}>Отмена</button>
                <button type="submit" className="ps-btn ps-btn-sm ps-btn-primary" disabled={busy || !linkUrl.trim()}>Добавить</button>
              </div>
            </form>
          )}
        </>
      )}

      {items === null && <div style={{ color: c.muted, fontSize: 12, textAlign: 'center', padding: 16 }}>Загрузка…</div>}
      {error && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</div>}
      {items?.length === 0 && !error && (
        <div style={{ color: c.muted, fontSize: 12, textAlign: 'center', padding: '18px 8px', lineHeight: 1.5 }}>
          {canManage ? 'Прикрепите презентацию, текст или ссылку — ученики увидят их во время урока и после него' : 'К этому уроку пока нет материалов'}
        </div>
      )}

      {items?.map(m => {
        const b = badgeFor(m)
        const href = m.kind === 'LINK' ? m.url : fileUrl(m.url)
        return (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, background: c.card, border: `1px solid ${c.border}` }}>
            <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: b.color, color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: '.04em' }}>{b.label}</span>
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: 'none' }} title={m.title}>
              <div style={{ fontSize: 13, fontWeight: 800, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {[m.kind === 'LINK' ? hostOf(m.url) : fmtSize(m.size), m.createdAt ? fmtShortDateTime(m.createdAt) : null].filter(Boolean).join(' · ')}
              </div>
            </a>
            <a href={href} target="_blank" rel="noopener noreferrer" download={m.kind === 'FILE' ? m.title : undefined}
              aria-label={m.kind === 'LINK' ? `Открыть ${m.title}` : `Скачать ${m.title}`}
              style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', color: c.muted, flexShrink: 0 }}>
              <Icon name={m.kind === 'LINK' ? 'arrow' : 'download'} size={15} />
            </a>
            {m.canDelete && (
              <button type="button" onClick={() => remove(m)} aria-label={`Удалить ${m.title}`}
                style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', color: c.muted, flexShrink: 0 }}>
                <Icon name="plus" size={15} style={{ transform: 'rotate(45deg)' }} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
