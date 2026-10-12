import { useState, useRef, useMemo } from 'react'
import { toast } from './Toast'
import { homeworkApi } from '../api/homework'
import { uploadFile } from '../api/files'
import { fmtShortDateTime, zonedNow } from '../lib/time'

/*
  Создание домашнего задания — по шагам, чтобы было видно «что, кому и к какому сроку»:
    1. К какому уроку (в уроке — уже выбран);
    2. Что сделать: название, описание, файл;
    3. Срок — быстрые варианты или своя дата;
  внизу — итог: кто получит задание и до какого времени.
  Задание привязывается к уроку и приходит всем его ученикам (в группе каждый сдаёт своё решение).

  fixedLesson — урок, к которому задаём (в конференции): { id, scheduled_at, language, students: 'Анна, Пётр' }
  lessons     — список для выбора (страница ДЗ), initialLessonId — предвыбор
*/

const pad = n => String(n).padStart(2, '0')
function dateIn(days) {
  const d = zonedNow()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function fmtDay(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const M = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
  return `${d} ${M[m - 1]}${y !== zonedNow().getFullYear() ? ` ${y}` : ''}`
}

const DUE_PRESETS = [
  { id: 'd1', l: 'Завтра',         days: 1 },
  { id: 'd3', l: 'Через 3 дня',    days: 3 },
  { id: 'd7', l: 'Через неделю',   days: 7 },
  { id: 'none', l: 'Без срока',    days: null },
]

function lessonWhen(l) {
  const at = new Date(l.scheduled_at).getTime()
  const now = Date.now()
  if (Math.abs(at - now) < 90 * 60000) return 'сейчас'
  return at > now ? 'предстоит' : 'прошёл'
}

export default function HomeworkForm({ fixedLesson = null, lessons = [], initialLessonId = null, dark = false, onDone, onCancel }) {
  // по умолчанию — урок, ближайший к текущему моменту (обычно только что прошедший)
  const defaultLesson = useMemo(() => {
    if (fixedLesson) return fixedLesson.id
    if (initialLessonId && lessons.some(l => String(l.id) === String(initialLessonId))) return initialLessonId
    const now = Date.now()
    const past = lessons.filter(l => new Date(l.scheduled_at).getTime() <= now + 90 * 60000)
    return (past[0] ?? lessons[0])?.id ?? ''
  }, [fixedLesson, lessons, initialLessonId])

  const [lessonId, setLessonId] = useState(defaultLesson)
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [preset, setPreset]     = useState('d7')
  const [due, setDue]           = useState(dateIn(7))
  const [file, setFile]         = useState(null)
  const [saving, setSaving]     = useState(false)
  const fileRef = useRef(null)

  const lesson = fixedLesson ?? lessons.find(l => String(l.id) === String(lessonId || defaultLesson))
  const recipients = lesson?.students || ''
  const many = recipients.includes(',')

  const c = dark
    ? { text: '#fff', muted: 'rgba(255,255,255,.6)', box: 'rgba(255,255,255,.05)', border: 'rgba(255,255,255,.14)', input: 'rgba(255,255,255,.06)', chip: 'rgba(255,255,255,.08)', chipOn: 'var(--purple)', step: '#A9A3F0' }
    : { text: 'var(--ink)', muted: 'var(--ink-muted)', box: 'var(--bg-cream-soft)', border: 'var(--border)', input: '#fff', chip: 'var(--bg-cream)', chipOn: 'var(--purple)', step: 'var(--purple)' }

  const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${c.border}`, background: c.input, color: c.text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }
  const stepTitle = (n, t) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: c.text }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: c.step, color: '#fff', fontSize: 12, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{n}</span>
      {t}
    </div>
  )

  function pickPreset(p) {
    setPreset(p.id)
    setDue(p.days == null ? '' : dateIn(p.days))
  }

  async function submit(e) {
    e.preventDefault()
    const lid = fixedLesson?.id ?? (lessonId || defaultLesson)
    if (!lid) { toast('Выберите урок', 'warning'); return }
    if (!title.trim()) { toast('Напишите, что нужно сделать', 'warning'); return }
    setSaving(true)
    try {
      const attachmentUrl = file ? (await uploadFile(file, 'HOMEWORK')).url : null
      const r = await homeworkApi.create({ lessonId: Number(lid), title: title.trim(), description: desc.trim() || null, dueAt: due || null, attachmentUrl })
      toast(r?.recipients > 1 ? `Задание отправлено ${r.recipients} ученикам ✓` : 'Задание отправлено ✓', 'success')
      onDone?.()
    } catch (err) {
      toast(err.message || 'Не удалось создать задание', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18, color: c.text }}>
      {/* 1. Урок */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stepTitle(1, fixedLesson ? 'Урок' : 'К какому уроку')}
        {fixedLesson ? (
          <div style={{ padding: '10px 12px', borderRadius: 12, background: c.box, border: `1px solid ${c.border}`, fontSize: 13 }}>
            <b>Этот урок</b> · {fmtShortDateTime(fixedLesson.scheduled_at)}{fixedLesson.language ? ` · ${fixedLesson.language}` : ''}
          </div>
        ) : lessons.length === 0 ? (
          <div style={{ fontSize: 13, color: c.muted }}>Нет уроков за последние 30 дней и ближайшие 2 недели</div>
        ) : (
          <div role="radiogroup" aria-label="Урок" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 210, overflowY: 'auto', paddingRight: 2 }}>
            {lessons.map(l => {
              const on = String(l.id) === String(lessonId || defaultLesson)
              const when = lessonWhen(l)
              return (
                <button key={l.id} type="button" role="radio" aria-checked={on} onClick={() => setLessonId(l.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    border: `1.5px solid ${on ? 'var(--purple)' : c.border}`, background: on ? (dark ? 'rgba(108,99,196,.25)' : 'var(--purple-tint)') : c.input, color: c.text }}>
                  <span className={`ps-flag ps-flag-${l.lang}`} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{fmtShortDateTime(l.scheduled_at)} · {l.language}</span>
                    <span style={{ display: 'block', fontSize: 12, color: c.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.students || 'без учеников'}</span>
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: when === 'сейчас' ? 'var(--orange-deep)' : c.muted, flexShrink: 0 }}>{when}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. Что сделать */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stepTitle(2, 'Что сделать')}
        <input value={title} onChange={e => setTitle(e.target.value)} maxLength={255} aria-label="Название задания"
          placeholder="Коротко: «Упражнения 3–5, стр. 42» или «Эссе о путешествии»" style={input} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} aria-label="Подробности задания"
          placeholder="Подробности (необязательно): что именно сделать, в каком виде сдать — текстом, фото или аудио" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="ps-btn ps-btn-sm" onClick={() => fileRef.current?.click()}
            style={{ background: c.chip, color: c.text, border: `1px solid ${c.border}` }}>
            📎 {file ? 'Заменить файл' : 'Прикрепить файл к заданию'}
          </button>
          {file && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.muted, maxWidth: '100%' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{file.name}</span>
              <button type="button" onClick={() => setFile(null)} aria-label="Убрать файл" style={{ border: 'none', background: 'none', color: c.muted, cursor: 'pointer', fontSize: 14 }}>✕</button>
            </span>
          )}
          <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>

      {/* 3. Срок */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stepTitle(3, 'Срок сдачи')}
        <div role="radiogroup" aria-label="Срок сдачи" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DUE_PRESETS.map(p => (
            <button key={p.id} type="button" role="radio" aria-checked={preset === p.id} onClick={() => pickPreset(p)}
              style={{ padding: '7px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
                background: preset === p.id ? c.chipOn : c.chip, color: preset === p.id ? '#fff' : c.text }}>
              {p.l}
            </button>
          ))}
          <input type="date" value={due} min={dateIn(0)} onChange={e => { setDue(e.target.value); setPreset('custom') }} aria-label="Своя дата"
            style={{ ...input, width: 'auto', padding: '6px 10px', fontSize: 12, colorScheme: dark ? 'dark' : 'light', borderColor: preset === 'custom' ? 'var(--purple)' : c.border }} />
        </div>
      </div>

      {/* Итог */}
      <div style={{ padding: '12px 14px', borderRadius: 12, background: dark ? 'rgba(124,224,163,.1)' : 'var(--success-soft)', fontSize: 13, lineHeight: 1.5, color: c.text }}>
        {lesson ? (
          <>
            <b>{recipients || 'Ученики урока'}</b> {many ? 'получат' : 'получит'} задание
            {title.trim() ? <> «{title.trim()}»</> : null}
            {due ? <> — сдать до <b>{fmtDay(due)}, 23:59</b></> : <> без срока</>}.
            {many && ' Каждый сдаёт своё решение.'} Уведомление придёт сразу.
          </>
        ) : 'Выберите урок — задание получат все его ученики.'}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="ps-btn ps-btn-ghost" onClick={onCancel} style={dark ? { color: '#fff' } : undefined}>Отмена</button>
        )}
        <button type="submit" className="ps-btn ps-btn-primary" disabled={saving || !title.trim() || !lesson}>
          {saving ? 'Отправка…' : 'Отправить задание'}
        </button>
      </div>
    </form>
  )
}
