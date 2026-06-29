import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar   from '../components/Sidebar'
import TopBar    from '../components/TopBar'
import Icon      from '../components/Icon'
import ApiError  from '../components/ApiError'
import { useApp } from '../context/AppContext'
import { teachersApi } from '../api/teachers'
import { adminApi } from '../api/admin'
import { toast } from '../components/Toast'

const LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--warning)', es: 'var(--success)', it: 'var(--info)' }
const LANGS = [
  { code: 'fr', name: 'Французский' }, { code: 'en', name: 'Английский' },
  { code: 'de', name: 'Немецкий' },   { code: 'es', name: 'Испанский' }, { code: 'it', name: 'Итальянский' },
]

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 6, background: 'var(--border-soft)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  )
}

function StudentCard({ s, onMessage, onSchedule }) {
  const color = LANG_COLOR[s.lang] || 'var(--purple)'
  return (
    <div className="ps-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: color + '22', border: `2px solid ${color}44`,
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color,
        }}>
          {s.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{s.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
            {s.language} · {s.level}
          </div>
        </div>
        <span className={`ps-chip ps-chip-${s.status === 'ACTIVE' ? 'green' : s.status === 'PAUSED' ? 'orange' : 'gray'}`}>
          {s.status === 'ACTIVE' ? 'Активен' : s.status === 'PAUSED' ? 'Пауза' : 'Завершён'}
        </span>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
          <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Прогресс</span>
          <span style={{ fontWeight: 800, color }}>{s.progress}%</span>
        </div>
        <ProgressBar value={s.progress} color={color} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-soft)' }}>
        {s.nextLesson ? (
          <div style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Следующий урок: </span>
            <span style={{ color, fontWeight: 800 }}>{s.nextLesson}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Уроки не запланированы</span>
        )}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            className="ps-btn ps-btn-ghost ps-btn-sm"
            onClick={() => onSchedule(s)}
          >
            <Icon name="calendar" size={13} /> Запланировать
          </button>
          <button
            className="ps-btn ps-btn-ghost ps-btn-sm"
            onClick={() => onMessage(s)}
          >
            <Icon name="chat" size={13} /> Написать
          </button>
        </div>
      </div>
    </div>
  )
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Понедельник' }, { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },        { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },      { value: 6, label: 'Субота' },
  { value: 7, label: 'Воскресенье' },
]

function ScheduleLessonModal({ student, onClose, onDone }) {
  const [mode, setMode] = useState('once')   // 'once' | 'recurring'
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [weeksCount, setWeeksCount] = useState(8)
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (mode === 'once') {
      if (!date || !time) { toast('Укажите дату и время', 'warning'); return }
      setSaving(true)
      try {
        await teachersApi.createLesson({ studentId: student.id, scheduledAt: `${date}T${time}:00` })
        toast('Занятие назначено ✓', 'success')
        onDone()
        onClose()
      } catch (e) {
        toast(e.message || 'Не удалось назначить занятие', 'error')
      } finally {
        setSaving(false)
      }
    } else {
      if (!time) { toast('Укажите время', 'warning'); return }
      setSaving(true)
      try {
        await teachersApi.createRecurringLessons({ studentId: student.id, dayOfWeek: Number(dayOfWeek), time, weeksCount: Number(weeksCount) })
        toast(`Занятия на ${weeksCount} недель назначены ✓`, 'success')
        onDone()
        onClose()
      } catch (e) {
        toast(e.message || 'Не удалось назначить занятия', 'error')
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 460, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>расписание</span>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 18, margin: '4px 0 0' }}>Занятие · {student.name}</h3>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setMode('once')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                background: mode === 'once' ? 'var(--purple)' : 'var(--bg-cream-soft)',
                color: mode === 'once' ? '#fff' : 'var(--ink-muted)',
                border: mode === 'once' ? '2px solid var(--purple)' : '2px solid var(--border)',
              }}
            >Разовое занятие</button>
            <button
              onClick={() => setMode('recurring')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                background: mode === 'recurring' ? 'var(--purple)' : 'var(--bg-cream-soft)',
                color: mode === 'recurring' ? '#fff' : 'var(--ink-muted)',
                border: mode === 'recurring' ? '2px solid var(--purple)' : '2px solid var(--border)',
              }}
            >Каждую неделю</button>
          </div>

          {mode === 'once' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Дата</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Время</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, outline: 'none' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>День недели</label>
                <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14 }}>
                  {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Время</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Недель вперёд</label>
                  <input type="number" min={1} max={26} value={weeksCount} onChange={e => setWeeksCount(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, outline: 'none' }} />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="ps-btn ps-btn-primary" onClick={submit} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" size={14} /> {saving ? 'Сохранение...' : 'Назначить'}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeacherStudents() {
  const { sideRole } = useApp()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [langFilter, setLangFilter] = useState('all')
  const [scheduleFor, setScheduleFor] = useState(null)

  function loadStudents() {
    teachersApi.myStudents()
      .then(setStudents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadStudents() }, [])

  function handleMessage(s) {
    navigate('/messages', { state: {
      userId: s.id,
      teacherName: s.name, teacherInitials: s.initials,
      teacherColor: LANG_COLOR[s.lang] || 'var(--purple)',
      teacherRole: `${s.language} · ${s.level}`,
    }})
  }

  const langs = [...new Set(students.map(s => s.lang))]
  const filtered = langFilter === 'all' ? students : students.filter(s => s.lang === langFilter)
  const active = students.filter(s => s.status === 'ACTIVE').length

  const LANG_LABEL = { fr: 'Французский', en: 'Английский', de: 'Немецкий', es: 'Испанский', it: 'Итальянский' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Мои ученики" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {error && <ApiError message={error} />}

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего учеников',   v: students.length,   d: 'в базе',          icon: 'users',    color: 'var(--purple-deep)' },
              { l: 'Активных',         v: active,            d: 'занимаются',       icon: 'sparkle',  color: 'var(--success)'     },
              { l: 'Языков',           v: langs.length,      d: 'в работе',         icon: 'globe',    color: 'var(--orange-deep)' },
              { l: 'Средний прогресс', v: students.length
                ? Math.round(students.reduce((s,x) => s + x.progress, 0) / students.length) + '%'
                : '—',                                        d: 'по всем курсам',  icon: 'chart',    color: 'var(--purple)'      },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{loading ? '…' : k.v}</div>
                <div className="delta">{k.d}</div>
              </div>
            ))}
          </div>

          {/* Фильтры */}
          <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream-soft)', borderRadius: 999, border: '1px solid var(--border)', gap: 2, alignSelf: 'flex-start' }}>
            {[{ id: 'all', l: 'Все' }, ...langs.map(l => ({ id: l, l: LANG_LABEL[l] || l.toUpperCase() }))].map(f => (
              <button key={f.id} onClick={() => setLangFilter(f.id)} style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                border: 'none', cursor: 'pointer', transition: 'all .12s',
                background: langFilter === f.id ? 'var(--purple)' : 'transparent',
                color:      langFilter === f.id ? '#fff' : 'var(--ink-muted)',
              }}>{f.l}</button>
            ))}
          </div>

          {/* Список */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
              {students.length === 0 ? 'У вас пока нет учеников' : 'Нет учеников по этому фильтру'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map(s => (
                <StudentCard key={s.id} s={s} onMessage={handleMessage} onSchedule={setScheduleFor} />
              ))}
            </div>
          )}
        </div>
      </main>

      {scheduleFor && (
        <ScheduleLessonModal
          student={scheduleFor}
          onClose={() => setScheduleFor(null)}
          onDone={loadStudents}
        />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   АДМИН: все ученики + назначение преподавателя / привязка родителя
   ════════════════════════════════════════════════════════════════ */

function AssignModal({ student, onClose, onDone }) {
  const [teachers,  setTeachers]  = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [lang,      setLang]      = useState('')
  const [busy,      setBusy]      = useState(false)

  useEffect(() => { teachersApi.list().then(setTeachers).catch(() => {}) }, [])

  const selectedTeacher = teachers.find(t => String(t.id) === String(teacherId))
  const teacherLangs = selectedTeacher
    ? LANGS.filter(l => (selectedTeacher.langCodes ?? []).includes(l.code))
    : []

  // Reset lang when teacher changes
  useEffect(() => {
    setLang(teacherLangs.length > 0 ? teacherLangs[0].code : '')
  }, [teacherId])

  async function submit() {
    if (!teacherId) { toast('Выберите преподавателя', 'warning'); return }
    if (!lang)      { toast('Выберите язык', 'warning'); return }
    setBusy(true)
    try {
      await adminApi.assignTeacher({ studentId: student.id, teacherId: Number(teacherId), languageCode: lang })
      toast('Преподаватель назначен ✓', 'success'); onDone(); onClose()
    } catch (e) { toast(e.message || 'Ошибка', 'error') } finally { setBusy(false) }
  }

  return (
    <ModalShell title={`Назначить преподавателя · ${student.name}`} onClose={onClose}>
      <FieldRow label="Преподаватель">
        <select className="ps-input" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
          <option value="">— выбрать —</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.email ? ` (${t.email})` : ''}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Язык">
        <select className="ps-input" value={lang} onChange={e => setLang(e.target.value)}
          disabled={teacherLangs.length === 0}>
          {teacherLangs.length === 0
            ? <option value="">— сначала выберите преподавателя —</option>
            : teacherLangs.map(l => <option key={l.code} value={l.code}>{l.name}</option>)
          }
        </select>
      </FieldRow>
      <ModalActions busy={busy} onSubmit={submit} onClose={onClose} label="Назначить" />
    </ModalShell>
  )
}

function LinkParentModal({ student, onClose, onDone }) {
  const [parents, setParents] = useState([])
  const [parentId, setParentId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi.users().then(us => setParents(us.filter(u => u.role === 'PARENT'))).catch(() => {})
  }, [])

  async function submit() {
    if (!parentId) { toast('Выберите родителя', 'warning'); return }
    setBusy(true)
    try {
      await adminApi.linkParent({ parentId: Number(parentId), studentId: student.id })
      toast('Родитель привязан ✓', 'success'); onDone(); onClose()
    } catch (e) { toast(e.message || 'Ошибка', 'error') } finally { setBusy(false) }
  }

  return (
    <ModalShell title={`Привязать родителя · ${student.name}`} onClose={onClose}>
      <FieldRow label="Родитель">
        <select className="ps-input" value={parentId} onChange={e => setParentId(e.target.value)}>
          <option value="">— выбрать —</option>
          {parents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
        </select>
      </FieldRow>
      {parents.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>Нет пользователей с ролью «Родитель». Создайте их на странице «Пользователи».</div>}
      <ModalActions busy={busy} onSubmit={submit} onClose={onClose} label="Привязать" />
    </ModalShell>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 440, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '18px 22px' }}>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 17, margin: 0 }}>{title}</h3>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
      </div>
    </div>
  )
}
function FieldRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}
function ModalActions({ busy, onSubmit, onClose, label }) {
  return (
    <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
      <button className="ps-btn ps-btn-primary" onClick={onSubmit} disabled={busy} style={{ flex: 1, justifyContent: 'center' }}>{busy ? '...' : label}</button>
      <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
    </div>
  )
}

function AdminStudents() {
  const { sideRole } = useApp()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [assign, setAssign]     = useState(null)
  const [link, setLink]         = useState(null)

  function load() {
    setLoading(true)
    adminApi.students().then(setStudents).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Ученики" />
        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего учеников', v: students.length, icon: 'users', color: 'var(--purple-deep)' },
              { l: 'С преподавателем', v: students.filter(s => s.teachers).length, icon: 'sparkle', color: 'var(--success)' },
              { l: 'Средний прогресс', v: students.length ? Math.round(students.reduce((a,s)=>a+(s.progress||0),0)/students.length)+'%' : '—', icon: 'chart', color: 'var(--orange-deep)' },
            ].map((k,i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}><Icon name={k.icon} size={16} /><div className="label">{k.l}</div></div>
                <div className="val">{loading ? '…' : k.v}</div>
              </div>
            ))}
          </div>

          {!loading && students.length === 0 && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>Учеников пока нет</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {students.map(s => (
              <div key={s.id} className="ps-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="ps-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>{s.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{s.email}{s.parentName ? ` · родитель: ${s.parentName}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--purple-deep)' }}>{s.progress ?? 0}%</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  <Icon name="sparkle" size={11} /> {s.teachers || 'Преподаватель не назначен'} · {s.courses ?? 0} курс(ов)
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
                  <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={() => setAssign(s)}><Icon name="plus" size={12} /> Преподаватель</button>
                  <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => setLink(s)}><Icon name="users" size={12} /> Родитель</button>
                  <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => navigate('/messages', { state: { userId: s.id, teacherName: s.name, teacherInitials: s.initials } })}><Icon name="chat" size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {assign && <AssignModal student={assign} onClose={() => setAssign(null)} onDone={load} />}
      {link && <LinkParentModal student={link} onClose={() => setLink(null)} onDone={load} />}
    </div>
  )
}

export default function StudentsPage() {
  const { role } = useApp()
  if (role === 'admin' || role === 'manager') return <AdminStudents />
  return <TeacherStudents />
}
