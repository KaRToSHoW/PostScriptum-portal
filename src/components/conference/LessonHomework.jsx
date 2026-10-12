import { useState, useEffect, useCallback } from 'react'
import { toast } from '../Toast'
import HomeworkForm from '../HomeworkForm'
import { homeworkApi } from '../../api/homework'
import { fileUrl } from '../../api/files'
import { fmtShortDateTime } from '../../lib/time'

/*
  Домашнее задание к уроку в конференции.
  Ученик: задания урока, срок, статус своего решения.
  Преподаватель: задать ДЗ (пошаговая форма), а под каждым заданием — решения учеников:
  текст, файл, оценка и комментарий прямо здесь, не выходя из урока.
  homework — из /api/conference/{id}/info; onCreated — перезагрузить info и оповестить участников.
*/

const STATUS = {
  ASSIGNED:  { l: 'Не сдано',    bg: 'rgba(245,196,81,.16)',  c: '#F5C451' },
  OVERDUE:   { l: 'Просрочено',  bg: 'rgba(255,122,110,.18)', c: '#FFB3AC' },
  SUBMITTED: { l: 'На проверке', bg: 'rgba(110,160,255,.18)', c: '#9CC0FF' },
  REVIEWED:  { l: 'Проверено',   bg: 'rgba(124,224,163,.18)', c: '#8FEBB0' },
}

function Chip({ status, grade }) {
  const st = STATUS[status] ?? STATUS.ASSIGNED
  return (
    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: st.bg, color: st.c, whiteSpace: 'nowrap' }}>
      {st.l}{grade != null ? ` · ${grade}/10` : ''}
    </span>
  )
}

/* Решение одного ученика с проверкой */
function Submission({ row, onReviewed }) {
  const [open, setOpen]         = useState(row.status === 'SUBMITTED')
  const [grade, setGrade]       = useState(row.grade ?? null)
  const [feedback, setFeedback] = useState(row.feedback ?? '')
  const [saving, setSaving]     = useState(false)
  const submitted = row.status === 'SUBMITTED' || row.status === 'REVIEWED'

  async function review() {
    if (!grade) { toast('Выберите оценку', 'warning'); return }
    setSaving(true)
    try {
      await homeworkApi.review(row.id, { studentId: row.studentId, grade, feedback: feedback.trim() || null })
      toast(`Оценка ${grade}/10 — ${row.student} ✓`, 'success')
      onReviewed()
    } catch (e) {
      toast(e.message || 'Не удалось сохранить оценку', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ borderRadius: 12, background: 'rgba(0,0,0,.18)', overflow: 'hidden' }}>
      <button type="button" onClick={() => submitted && setOpen(o => !o)} aria-expanded={open} disabled={!submitted}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', border: 'none', background: 'transparent', color: '#fff', cursor: submitted ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'left' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.student}</span>
        <Chip status={row.status} grade={row.grade} />
        {submitted && <span aria-hidden="true" style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{open ? '▲' : '▼'}</span>}
      </button>

      {open && submitted && (
        <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {row.submittedAt && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>Сдано {fmtShortDateTime(row.submittedAt)}</div>}
          {row.text
            ? <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 10, borderRadius: 10, background: 'rgba(255,255,255,.06)', maxHeight: 220, overflowY: 'auto' }}>{row.text}</div>
            : !row.fileUrl && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Без текста</div>}
          {row.fileUrl && (
            <a href={fileUrl(row.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 800, color: '#A9A3F0', textDecoration: 'none' }}>📎 Файл решения ↗</a>
          )}

          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>Оценка</div>
          <div role="radiogroup" aria-label="Оценка от 1 до 10" style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button key={n} type="button" role="radio" aria-checked={grade === n} onClick={() => setGrade(n)}
                style={{ padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
                  background: grade === n ? (n >= 9 ? '#3E9B5C' : n >= 7 ? '#C99A2E' : '#C0504A') : 'rgba(255,255,255,.08)', color: '#fff' }}>
                {n}
              </button>
            ))}
          </div>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} placeholder="Комментарий ученику (необязательно)" aria-label="Комментарий к оценке"
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
          <button type="button" className="ps-btn ps-btn-sm ps-btn-primary" onClick={review} disabled={saving || !grade} style={{ alignSelf: 'flex-end' }}>
            {saving ? 'Сохранение…' : row.status === 'REVIEWED' ? 'Изменить оценку' : 'Поставить оценку'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function LessonHomework({ lessonId, lesson, students = [], homework = [], isTeacher, onCreated }) {
  const [formOpen, setFormOpen] = useState(false)
  const [rows, setRows]         = useState(null)   // решения: строки «задание + ученик» (только преподавателю)

  const hwIds = homework.map(h => h.id).join(',')
  const loadSubmissions = useCallback(() => {
    if (!isTeacher || !hwIds) { setRows([]); return }
    const ids = new Set(hwIds.split(',').map(Number))
    homeworkApi.teacherList()
      .then(list => setRows((list || []).filter(r => ids.has(Number(r.id)))))
      .catch(() => setRows([]))
  }, [isTeacher, hwIds])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  const fixedLesson = lesson ? { id: Number(lessonId), scheduled_at: lesson.scheduled_at, language: lesson.language, students: students.map(s => s.name).join(', ') } : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {isTeacher && !formOpen && (
        <button type="button" className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setFormOpen(true)} style={{ justifyContent: 'center' }}>
          + Задать ДЗ к этому уроку
        </button>
      )}

      {isTeacher && formOpen && fixedLesson && (
        <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
          <HomeworkForm dark fixedLesson={fixedLesson}
            onDone={() => { setFormOpen(false); onCreated?.() }}
            onCancel={() => setFormOpen(false)} />
        </div>
      )}

      {isTeacher && homework.length > 0 && (
        <button type="button" onClick={loadSubmissions}
          style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: '#A9A3F0', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          ↻ Обновить решения
        </button>
      )}

      {homework.length === 0 && !formOpen && (
        <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textAlign: 'center', padding: '18px 8px', lineHeight: 1.5 }}>
          {isTeacher ? 'К этому уроку пока нет домашнего задания' : 'Домашнее задание к этому уроку пока не задано'}
        </div>
      )}

      {homework.map(h => {
        const overdue = h.due_at && new Date(h.due_at) < new Date() && !h.my_status
        const mine = rows?.filter(r => Number(r.id) === Number(h.id)) ?? []
        const done = mine.filter(r => r.status === 'SUBMITTED' || r.status === 'REVIEWED').length
        return (
          <div key={h.id} style={{ padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>{h.title}</div>
              {!isTeacher && <Chip status={h.my_status ?? (overdue ? 'OVERDUE' : 'ASSIGNED')} grade={h.my_grade} />}
            </div>
            {h.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{h.description}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
              <span>{h.due_at ? `Срок: ${fmtShortDateTime(h.due_at)}` : 'Без срока'}</span>
              {isTeacher && <span>Сдали: {rows ? done : (h.submitted ?? 0)} из {students.length}</span>}
              {h.attachment_url && (
                <a href={fileUrl(h.attachment_url)} target="_blank" rel="noopener noreferrer" style={{ color: '#A9A3F0', fontWeight: 700, textDecoration: 'none' }}>📎 Файл задания ↗</a>
              )}
            </div>

            {isTeacher && rows === null && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Загрузка решений…</div>}
            {isTeacher && mine.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                {mine.map(r => <Submission key={`${r.id}-${r.studentId}`} row={r} onReviewed={loadSubmissions} />)}
              </div>
            )}

            {!isTeacher && (
              <a href="/homework" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 800, color: '#A9A3F0', textDecoration: 'none' }}>
                {h.my_status ? 'Открыть моё решение ↗' : 'Сдать решение ↗'}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
