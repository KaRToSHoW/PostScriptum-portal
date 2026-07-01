import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar   from '../components/Sidebar'
import TopBar    from '../components/TopBar'
import Icon      from '../components/Icon'
import { useApp } from '../context/AppContext'
import { toast } from '../components/Toast'
import { homeworkApi } from '../api/homework'
import { teachersApi } from '../api/teachers'
import { uploadFile, fileUrl } from '../api/files'

// ─── shared maps ─────────────────────────────────────────────────────────────

const STATUS_MAP = {
  ASSIGNED: 'new', not_started: 'new',
  SUBMITTED: 'done', submitted: 'done',
  REVIEWED: 'done', done: 'done',
  OVERDUE: 'overdue', overdue: 'overdue',
}

function mapHw(h) {
  return {
    id:            h.id,
    title:         h.title,
    description:   h.description ?? '',
    state:         STATUS_MAP[h.status] ?? 'new',
    lang:          h.lang ?? 'fr',
    due:           h.due ?? '',
    dueLabel:      h.due ?? '',
    grade:         h.grade ?? null,
    comment:       h.feedback ?? null,
    teacher:       h.teacher ?? '',
    course:        h.course ?? '',
    attachmentUrl: h.attachmentUrl ?? null,
  }
}

const STATE_CFG = {
  new:      { label: 'Не начато',  chip: 'blue'   },
  progress: { label: 'В работе',   chip: 'orange' },
  done:     { label: 'Сдано',      chip: 'green'  },
  overdue:  { label: 'Просрочено', chip: 'red'    },
}

// ─── shared UI ───────────────────────────────────────────────────────────────

function GradeCircle({ grade }) {
  const color = grade >= 9 ? 'var(--success)' : grade >= 7 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${color}`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color, flexShrink: 0 }}>
      {grade}
    </div>
  )
}

// ─── STUDENT ─────────────────────────────────────────────────────────────────

const STUDENT_TABS = [
  { id: 'all',      label: 'Все',        filter: () => true },
  { id: 'new',      label: 'Новые',      filter: h => h.state === 'new' },
  { id: 'progress', label: 'В работе',   filter: h => h.state === 'progress' },
  { id: 'done',     label: 'Сдано',      filter: h => h.state === 'done' },
  { id: 'overdue',  label: 'Просрочено', filter: h => h.state === 'overdue' },
]

function SubmitModal({ hw, onClose, onDone }) {
  const [text, setText]           = useState('')
  const [link, setLink]           = useState('')
  const [uploading, setUploading] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)   // { url, name }
  const fileRef = useRef()

  async function handleFilePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile(file, 'HOMEWORK')
      setAttachedFile({ url: res.url, name: res.name ?? file.name })
      toast('Файл прикреплён ✓', 'success')
    } catch {
      toast('Не удалось загрузить файл', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!text.trim() && !link.trim() && !attachedFile) {
      toast('Добавьте комментарий, ссылку или файл', 'warning')
      return
    }
    try {
      await homeworkApi.submit(hw.id, {
        text: text || link || '',
        fileUrl: attachedFile?.url ?? null,
      })
      toast('Задание отправлено на проверку ✓', 'success')
      onDone()
      onClose()
    } catch {
      toast('Ошибка при отправке', 'error')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 520, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>сдать задание</span>
              <h3 className="ps-display ps-display-purple" style={{ fontSize: 18, margin: '4px 0 0' }}>{hw.title}</h3>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Комментарий к работе</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Напишите что сделали, какие были трудности..."
              rows={4}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, color: 'var(--ink)', resize: 'none', outline: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Ссылка на работу (Google Docs, Notion...)</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://..."
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
            />
          </div>

          {/* File upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Прикрепить файл</label>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFilePick} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="ps-btn ps-btn-ghost ps-btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ flexShrink: 0 }}
              >
                <Icon name="upload" size={13} />
                {uploading ? 'Загрузка...' : 'Выбрать файл'}
              </button>
              {attachedFile && (
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ✓ {attachedFile.name}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button className="ps-btn ps-btn-primary" onClick={handleSubmit} style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="upload" size={14} /> Отправить на проверку
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HwRow({ hw, expanded, onToggle, onSubmit, onMessage }) {
  const cfg = STATE_CFG[hw.state]
  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--border-soft)', overflow: 'hidden', background: '#fff' }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
      >
        <span className={`ps-flag ps-flag-${hw.lang}`} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{hw.title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{hw.course} · {hw.teacher}</div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700, flexShrink: 0 }}>{hw.dueLabel}</span>
        <span className={`ps-chip ps-chip-${cfg.chip}`}>{cfg.label}</span>
        {hw.grade !== null && <GradeCircle grade={hw.grade} />}
        <Icon name={expanded ? 'chevron-up' : 'chevron'} size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 28, fontSize: 13 }}>
            <div><span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Срок сдачи: </span>{hw.due}</div>
            <div><span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Курс: </span>{hw.course}</div>
            <div><span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Преподаватель: </span>{hw.teacher}</div>
          </div>

          {hw.description && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>Описание</div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{hw.description}</div>
            </div>
          )}

          {hw.attachmentUrl && (
            <a
              href={fileUrl(hw.attachmentUrl)}
              target="_blank"
              rel="noreferrer"
              className="ps-btn ps-btn-ghost ps-btn-sm"
              style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
            >
              <Icon name="file" size={13} /> Материал от преподавателя
            </a>
          )}

          {hw.grade !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--success-soft)' }}>
              <GradeCircle grade={hw.grade} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>Оценка: {hw.grade}/10</div>
                {hw.comment && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{hw.comment}</div>}
              </div>
            </div>
          )}

          {!hw.grade && hw.comment && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--success-soft)', fontSize: 13, color: 'var(--success)', fontWeight: 700 }}>
              💬 {hw.comment}
            </div>
          )}

          {hw.state === 'overdue' && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--danger-soft)', fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>
              ⚠ Срок сдачи истёк — сдайте как можно скорее или напишите преподавателю
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {(hw.state === 'new' || hw.state === 'progress' || hw.state === 'overdue') && (
              <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => onSubmit(hw)}>
                <Icon name="upload" size={13} /> Сдать задание
              </button>
            )}
            {hw.state === 'done' && (
              <button className="ps-btn ps-btn-sm" style={{ background: 'var(--success-soft)', color: 'var(--success)', border: 'none' }}
                onClick={() => toast(`Оценка: ${hw.grade ?? '—'}/10 · ${hw.comment || 'Работа принята'}`)}>
                <Icon name="check" size={13} /> Просмотреть работу
              </button>
            )}
            <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => onMessage(hw)}>
              <Icon name="chat" size={13} /> Написать преподавателю
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StudentHomework() {
  const { sideRole } = useApp()
  const navigate = useNavigate()
  const [tab, setTab]           = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [hwList, setHwList]     = useState([])
  const [submitHw, setSubmitHw] = useState(null)
  const [loading, setLoading]   = useState(true)

  function loadList() {
    setLoading(true)
    homeworkApi.list()
      .then(data => setHwList(data.map(mapHw)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [])

  const items = hwList.filter(STUDENT_TABS.find(t => t.id === tab).filter)

  const total   = hwList.length
  const done    = hwList.filter(h => h.state === 'done').length
  const overdue = hwList.filter(h => h.state === 'overdue').length
  const avgGrade = (() => {
    const graded = hwList.filter(h => h.grade)
    return graded.length ? (graded.reduce((s, h) => s + h.grade, 0) / graded.length).toFixed(1) : '—'
  })()

  function handleMessage(hw) {
    navigate('/messages', { state: { teacherName: hw.teacher } })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Домашние задания" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего заданий',   v: total,    d: 'за всё время',      icon: 'file',    color: 'var(--purple-deep)' },
              { l: 'Сдано',           v: done,     d: `${total ? Math.round(done/total*100) : 0}% выполнено`, icon: 'check',   color: 'var(--success)'    },
              { l: 'Просрочено',      v: overdue,  d: 'требует внимания',  icon: 'warning', color: 'var(--danger)'     },
              { l: 'Средняя оценка',  v: avgGrade, d: 'из 10',             icon: 'sparkle', color: 'var(--orange-deep)'},
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{k.v}</div>
                <div className="delta">{k.d}</div>
              </div>
            ))}
          </div>

          {/* Контент */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>

            {/* Список */}
            <div className="ps-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 className="ps-display" style={{ fontSize: 22, margin: 0 }}>Задания</h3>
                <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
                  {STUDENT_TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      style={{
                        padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                        border: 'none', cursor: 'pointer', transition: 'background .12s, color .12s',
                        background: tab === t.id ? 'var(--purple)' : 'transparent',
                        color:      tab === t.id ? '#fff' : 'var(--ink-muted)',
                      }}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>Загрузка...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.length === 0 && (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                      Заданий в этой категории нет
                    </div>
                  )}
                  {items.map(hw => (
                    <HwRow
                      key={hw.id}
                      hw={hw}
                      expanded={expanded === hw.id}
                      onToggle={() => setExpanded(expanded === hw.id ? null : hw.id)}
                      onSubmit={setSubmitHw}
                      onMessage={handleMessage}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Правая колонка */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div className="ps-card-purple" style={{ padding: 22 }}>
                <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>прогресс</span>
                <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '6px 0 18px' }}>
                  {done} из {total} сдано
                </h3>
                <div style={{ height: 8, background: 'rgba(255,255,255,.2)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${total ? Math.round(done/total*100) : 0}%`, background: 'var(--orange)', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>
                  {total ? Math.round(done/total*100) : 0}% выполнено
                </div>
              </div>

              <div className="ps-card" style={{ padding: 20 }}>
                <span className="ps-eyebrow">дедлайны</span>
                <h3 className="ps-display" style={{ fontSize: 18, margin: '6px 0 14px' }}>Скоро сдавать</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {hwList.filter(h => h.state !== 'done').slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`ps-flag ps-flag-${h.lang}`} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: h.state === 'overdue' ? 'var(--danger)' : 'var(--orange-deep)', flexShrink: 0 }}>{h.dueLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ps-card" style={{ padding: 20 }}>
                <span className="ps-eyebrow">оценки</span>
                <h3 className="ps-display" style={{ fontSize: 18, margin: '6px 0 14px' }}>Последние</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {hwList.filter(h => h.grade).slice(0, 3).map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <GradeCircle grade={h.grade} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {submitHw && (
        <SubmitModal
          hw={submitHw}
          onClose={() => setSubmitHw(null)}
          onDone={loadList}
        />
      )}
    </div>
  )
}

// ─── TEACHER ─────────────────────────────────────────────────────────────────

const TEACHER_STATUS_CFG = {
  ASSIGNED:  { label: 'Назначено',   chip: 'blue'   },
  SUBMITTED: { label: 'На проверке', chip: 'orange' },
  REVIEWED:  { label: 'Проверено',   chip: 'green'  },
  OVERDUE:   { label: 'Просрочено',  chip: 'red'    },
}

const TEACHER_TABS = [
  { id: 'all',      label: 'Все',           filter: () => true },
  { id: 'pending',  label: 'На проверке',   filter: i => i.status === 'SUBMITTED' },
  { id: 'reviewed', label: 'Проверено',     filter: i => i.status === 'REVIEWED'  },
]

function TeacherRow({ item, expanded, onToggle, onReviewed }) {
  const cfg = TEACHER_STATUS_CFG[item.status] ?? { label: item.status, chip: 'blue' }
  const [grade, setGrade]       = useState(item.grade ?? '')
  const [feedback, setFeedback] = useState(item.feedback ?? '')
  const [saving, setSaving]     = useState(false)

  async function handleReview() {
    if (!grade || Number(grade) < 1 || Number(grade) > 10) {
      toast('Укажите оценку от 1 до 10', 'warning')
      return
    }
    setSaving(true)
    try {
      await homeworkApi.review(item.id, { grade: Number(grade), feedback })
      toast('Оценка выставлена ✓', 'success')
      onReviewed()
    } catch {
      toast('Ошибка при сохранении оценки', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--border-soft)', overflow: 'hidden', background: '#fff' }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
      >
        {/* Student avatar */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {item.studentInitials ?? (item.student ?? '?').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{item.title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{item.student}</div>
        </div>
        <span className={`ps-flag ps-flag-${item.lang ?? 'fr'}`} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 700, flexShrink: 0 }}>{item.due ?? ''}</span>
        <span className={`ps-chip ps-chip-${cfg.chip}`}>{cfg.label}</span>
        {item.grade != null && <GradeCircle grade={item.grade} />}
        <Icon name={expanded ? 'chevron-up' : 'chevron'} size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* description */}
          {item.description && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>Задание</div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{item.description}</div>
            </div>
          )}

          {/* attachment provided to the student */}
          {item.attachmentUrl && (
            <a
              href={fileUrl(item.attachmentUrl)}
              target="_blank"
              rel="noreferrer"
              className="ps-btn ps-btn-ghost ps-btn-sm"
              style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
            >
              <Icon name="file" size={13} /> Материал к заданию
            </a>
          )}

          {/* student's answer */}
          {item.text && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>Ответ ученика</div>
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-cream-soft)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{item.text}</div>
            </div>
          )}

          {/* file link */}
          {item.fileUrl && (
            <a
              href={fileUrl(item.fileUrl)}
              target="_blank"
              rel="noreferrer"
              className="ps-btn ps-btn-ghost ps-btn-sm"
              style={{ alignSelf: 'flex-start', textDecoration: 'none' }}
            >
              <Icon name="file" size={13} /> Открыть файл
            </a>
          )}

          {item.submittedAt && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Сдано: {item.submittedAt}</div>
          )}

          {/* review form */}
          {item.status !== 'REVIEWED' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', borderRadius: 14, background: 'var(--bg-cream-soft)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Выставить оценку</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700 }}>Оценка (1–10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    style={{ width: 72, padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 700 }}>Комментарий</label>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Напишите комментарий к работе..."
                    rows={3}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 13, color: 'var(--ink)', resize: 'none', outline: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
                  />
                </div>
              </div>
              <button
                className="ps-btn ps-btn-primary ps-btn-sm"
                onClick={handleReview}
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                <Icon name="check" size={13} />
                {saving ? 'Сохранение...' : 'Поставить оценку'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--success-soft)' }}>
              <GradeCircle grade={item.grade} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>Оценка выставлена: {item.grade}/10</div>
                {item.feedback && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{item.feedback}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CreateHomeworkModal({ onClose, onDone }) {
  const [students, setStudents]   = useState([])
  const [studentId, setStudentId] = useState('')
  const [langCode,  setLangCode]  = useState('')
  const [title, setTitle]         = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const fileRef = useRef()

  useEffect(() => { teachersApi.myStudents().then(setStudents).catch(() => {}) }, [])

  const selectedStudent = students.find(s => String(s.id) === String(studentId))
  const studentLangCodes = selectedStudent?.langCodes ?? []

  // Reset langCode when student changes
  useEffect(() => {
    setLangCode(studentLangCodes[0] ?? '')
  }, [studentId])

  async function handleFilePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile(file, 'HOMEWORK')
      setAttachedFile({ url: res.url, name: res.name ?? file.name })
      toast('Файл прикреплён ✓', 'success')
    } catch {
      toast('Не удалось загрузить файл', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate() {
    if (!studentId) { toast('Выберите ученика', 'warning'); return }
    if (!title.trim()) { toast('Укажите название задания', 'warning'); return }
    setSaving(true)
    try {
      await homeworkApi.create({
        studentId: Number(studentId),
        title: title.trim(),
        description: description.trim() || null,
        dueAt: dueAt || null,
        attachmentUrl: attachedFile?.url ?? null,
        languageCode: langCode || undefined,
      })
      toast('Задание создано ✓', 'success')
      onDone()
      onClose()
    } catch {
      toast('Ошибка при создании задания', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 520, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>новое задание</span>
              <h3 className="ps-display ps-display-purple" style={{ fontSize: 18, margin: '4px 0 0' }}>Создать домашнее задание</h3>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Ученик</label>
            <select
              className="ps-input"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14 }}
            >
              <option value="">Выберите ученика</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.langs?.length ? ' · ' + s.langs.join(', ') : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Язык — только если у ученика 2+ языка */}
          {studentLangCodes.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Язык задания</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {studentLangCodes.map((code, i) => {
                  const name = (selectedStudent?.langs ?? [])[i] || code
                  const LCOLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--warning)', es: 'var(--success)', it: 'var(--info)' }
                  const c = LCOLOR[code] || 'var(--purple)'
                  const sel = langCode === code
                  return (
                    <button key={code} onClick={() => setLangCode(code)} style={{
                      padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                      background: sel ? c : c + '18', color: sel ? '#fff' : c,
                      outline: sel ? `2px solid ${c}` : 'none', outlineOffset: 1,
                    }}>{name}</button>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Название задания</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: Эссе про путешествия"
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Что нужно сделать..."
              rows={3}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, color: 'var(--ink)', resize: 'none', outline: 'none', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Срок сдачи</label>
            <input
              type="date"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Прикрепить материал</label>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFilePick} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="ps-btn ps-btn-ghost ps-btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ flexShrink: 0 }}
              >
                <Icon name="upload" size={13} />
                {uploading ? 'Загрузка...' : 'Выбрать файл'}
              </button>
              {attachedFile && (
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ✓ {attachedFile.name}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button className="ps-btn ps-btn-primary" onClick={handleCreate} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="plus" size={14} /> {saving ? 'Создание...' : 'Создать задание'}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const HW_LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--warning)', es: 'var(--success)', it: 'var(--info)' }
const HW_LANG_NAME  = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }

function TeacherHomework() {
  const { sideRole } = useApp()
  const [tab, setTab]               = useState('all')
  const [expanded, setExpanded]     = useState(null)
  const [list, setList]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [openStudents, setOpenStudents] = useState(new Set())
  const [studentFilter, setStudentFilter] = useState('all')
  const [langFilter, setLangFilter]       = useState('all')

  function loadList() {
    setLoading(true)
    homeworkApi.teacherList()
      .then(data => setList(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [])

  const total    = list.length
  const pending  = list.filter(i => i.status === 'SUBMITTED').length
  const reviewed = list.filter(i => i.status === 'REVIEWED').length

  // Уникальные ученики и языки для фильтров
  const allStudents = [...new Map(list.map(i => [i.studentId, { id: i.studentId, name: i.student, initials: i.studentInitials }])).values()]
  const allLangs    = [...new Set(list.map(i => i.lang).filter(Boolean))]

  const activeTab = TEACHER_TABS.find(t => t.id === tab)
  const items = list
    .filter(activeTab.filter)
    .filter(i => studentFilter === 'all' || String(i.studentId) === String(studentFilter))
    .filter(i => langFilter === 'all' || i.lang === langFilter)

  // Группировка по ученику
  const groups = []
  const groupIndex = new Map()
  for (const item of items) {
    const key = item.studentId ?? item.student
    if (!groupIndex.has(key)) {
      groupIndex.set(key, groups.length)
      groups.push({ studentId: item.studentId, student: item.student, studentInitials: item.studentInitials, items: [] })
    }
    groups[groupIndex.get(key)].items.push(item)
  }

  function toggleStudent(key) {
    setOpenStudents(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Домашние задания" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего работ',    v: total,    d: 'от учеников',     icon: 'file',    color: 'var(--purple-deep)' },
              { l: 'На проверке',    v: pending,  d: 'ожидают оценки',  icon: 'clock',   color: 'var(--orange-deep)' },
              { l: 'Проверено',      v: reviewed, d: 'выставлены оценки', icon: 'check', color: 'var(--success)'     },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{k.v}</div>
                <div className="delta">{k.d}</div>
              </div>
            ))}
          </div>

          {/* List */}
          <div className="ps-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <h3 className="ps-display" style={{ fontSize: 22, margin: 0 }}>Работы по ученикам</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
                  {TEACHER_TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      style={{
                        padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                        border: 'none', cursor: 'pointer', transition: 'background .12s, color .12s',
                        background: tab === t.id ? 'var(--purple)' : 'transparent',
                        color:      tab === t.id ? '#fff' : 'var(--ink-muted)',
                      }}
                    >{t.label}</button>
                  ))}
                </div>
                <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setShowCreate(true)}>
                  <Icon name="plus" size={13} /> Новое задание
                </button>
              </div>
            </div>

            {/* Фильтры */}
            {(allStudents.length > 1 || allLangs.length > 1) && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-soft)', alignItems: 'center' }}>

                {/* По ученику */}
                {allStudents.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase', flexShrink: 0 }}>Ученик</span>
                    <div style={{ display: 'inline-flex', padding: 2, background: 'var(--bg-cream-soft)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
                      <button onClick={() => setStudentFilter('all')} style={{
                        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer',
                        background: studentFilter === 'all' ? 'var(--purple)' : 'transparent',
                        color: studentFilter === 'all' ? '#fff' : 'var(--ink-muted)',
                      }}>Все</button>
                      {allStudents.map(s => (
                        <button key={s.id} onClick={() => setStudentFilter(String(s.id))} style={{
                          padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer',
                          background: studentFilter === String(s.id) ? 'var(--purple)' : 'transparent',
                          color: studentFilter === String(s.id) ? '#fff' : 'var(--ink-muted)',
                        }}>
                          {s.initials ?? s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* По языку */}
                {allLangs.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase', flexShrink: 0 }}>Язык</span>
                    <div style={{ display: 'inline-flex', padding: 2, background: 'var(--bg-cream-soft)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
                      <button onClick={() => setLangFilter('all')} style={{
                        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer',
                        background: langFilter === 'all' ? 'var(--purple)' : 'transparent',
                        color: langFilter === 'all' ? '#fff' : 'var(--ink-muted)',
                      }}>Все</button>
                      {allLangs.map(code => {
                        const c = HW_LANG_COLOR[code] || 'var(--purple)'
                        const sel = langFilter === code
                        return (
                          <button key={code} onClick={() => setLangFilter(code)} style={{
                            padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            background: sel ? c : 'transparent',
                            color: sel ? '#fff' : c,
                          }}>
                            <span className={`ps-flag ps-flag-${code}`} style={{ fontSize: 12 }} />
                            {HW_LANG_NAME[code] || code.toUpperCase()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>Загрузка...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {groups.length === 0 && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                    Работ в этой категории нет
                  </div>
                )}
                {groups.map(g => {
                  const key = g.studentId ?? g.student
                  const isOpen = openStudents.has(key)
                  const pendingInGroup = g.items.filter(i => i.status === 'SUBMITTED').length
                  return (
                    <div key={key} style={{ borderRadius: 16, border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
                      <div
                        onClick={() => toggleStudent(key)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', userSelect: 'none', background: 'var(--bg-cream-soft)' }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--purple)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                          {g.studentInitials ?? (g.student ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{g.student}</div>
                        <span className="ps-chip ps-chip-gray">{g.items.length} {g.items.length === 1 ? 'задание' : 'заданий'}</span>
                        {pendingInGroup > 0 && <span className="ps-chip ps-chip-orange">{pendingInGroup} на проверке</span>}
                        <Icon name={isOpen ? 'chevron-up' : 'chevron'} size={14} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                      </div>
                      {isOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#fff' }}>
                          {g.items.map(item => (
                            <TeacherRow
                              key={item.id}
                              item={item}
                              expanded={expanded === item.id}
                              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                              onReviewed={loadList}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {showCreate && (
        <CreateHomeworkModal
          onClose={() => setShowCreate(false)}
          onDone={loadList}
        />
      )}
    </div>
  )
}

// ─── default export ───────────────────────────────────────────────────────────

export default function HomeworkPage() {
  const { role } = useApp()
  if (role === 'teacher' || role === 'admin') {
    return <TeacherHomework />
  }
  return <StudentHomework />
}
