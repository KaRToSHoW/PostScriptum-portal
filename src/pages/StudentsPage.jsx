import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar   from '../components/Sidebar'
import TopBar    from '../components/TopBar'
import Icon      from '../components/Icon'
import ApiError  from '../components/ApiError'
import { useApp } from '../context/AppContext'
import { teachersApi } from '../api/teachers'
import { adminApi } from '../api/admin'
import { api } from '../api/client'
import { toast } from '../components/Toast'
import ScheduleLessonModal from '../components/ScheduleLessonModal'

const LANG_COLOR = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--warning)', es: 'var(--success)', it: 'var(--info)' }
const LANGS = [
  { code: 'fr', name: 'Французский' }, { code: 'en', name: 'Английский' },
  { code: 'de', name: 'Немецкий' },   { code: 'es', name: 'Испанский' }, { code: 'it', name: 'Итальянский' },
]

function StudentCard({ s, onMessage, onSchedule, extraActions }) {
  const firstCode = (s.langCodes ?? [])[0] || 'fr'
  const color = LANG_COLOR[firstCode] || 'var(--purple)'
  const langs = Array.isArray(s.langs)
    ? s.langs
    : ((s.langs ?? s.languages ?? '')).split(', ').filter(Boolean)
  const langCodes = Array.isArray(s.langCodes) ? s.langCodes : []
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
          {(s.showEmail || s.email) && <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 1 }}>{s.email}</div>}
          {s.parentName && <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 1 }}>Родитель: {s.parentName}</div>}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {langs.map((lang, i) => {
              const code = langCodes[i] || ''
              const c = LANG_COLOR[code] || 'var(--purple)'
              return <span key={code || i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: c + '18', color: c, border: `1px solid ${c}33` }}>{lang}</span>
            })}
          </div>
        </div>
        {s.status && (
          <span className={`ps-chip ps-chip-${s.status === 'ACTIVE' ? 'green' : s.status === 'PAUSED' ? 'orange' : 'gray'}`}>
            {s.status === 'ACTIVE' ? 'Активен' : s.status === 'PAUSED' ? 'Пауза' : 'Завершён'}
          </span>
        )}
      </div>

      <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(s.nextLesson || s.teachers) && (
          s.nextLesson ? (
            <div style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Следующий урок: </span>
              <span style={{ color, fontWeight: 800 }}>{s.nextLesson}</span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              <Icon name="sparkle" size={11} /> {s.teachers}
            </div>
          )
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {extraActions}
          {onSchedule && (
            <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => onSchedule(s)}>
              <Icon name="calendar" size={13} /> Запланировать
            </button>
          )}
          {onMessage && (
            <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => onMessage(s)}>
              <Icon name="chat" size={13} /> Написать
            </button>
          )}
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
    const firstCode = (s.langCodes ?? [])[0] || 'fr'
    const firstLang = (s.langs ?? [])[0] || ''
    navigate('/messages', { state: {
      userId: s.id,
      teacherName: s.name, teacherInitials: s.initials,
      teacherColor: LANG_COLOR[firstCode] || 'var(--purple)',
      teacherRole: firstLang,
    }})
  }

  const langs = [...new Set(students.flatMap(s => s.langCodes ?? []))]
  const nameCounts = students.reduce((acc, s) => { acc[s.name] = (acc[s.name] || 0) + 1; return acc }, {})
  const studentsWithDup = students.map(s => ({ ...s, showEmail: nameCounts[s.name] > 1 }))
  const filtered = langFilter === 'all'
    ? studentsWithDup
    : studentsWithDup.filter(s => (s.langCodes ?? []).includes(langFilter))
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего учеников', v: students.length, d: 'в базе',    icon: 'users',   color: 'var(--purple-deep)' },
              { l: 'Активных',       v: active,          d: 'занимаются', icon: 'sparkle', color: 'var(--success)'     },
              { l: 'Языков',         v: langs.length,    d: 'в работе',   icon: 'globe',   color: 'var(--orange-deep)' },
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
  const [teachers, setTeachers]       = useState([])
  const [teacherId, setTeacherId]     = useState('')
  const [students, setStudents]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [assign, setAssign]           = useState(null)
  const [link, setLink]               = useState(null)
  const [scheduleFor, setScheduleFor] = useState(null)

  useEffect(() => {
    api.get('/api/manager/teachers').then(setTeachers).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    const req = teacherId
      ? api.get(`/api/manager/teacher/${teacherId}/students`)
      : adminApi.students()
    req
      .then(r => setStudents(Array.isArray(r) ? r : []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [teacherId])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Ученики" />
        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего учеников',   v: students.length,                         icon: 'users',   color: 'var(--purple-deep)' },
              { l: 'С преподавателем', v: students.filter(s => s.teachers || teacherId).length, icon: 'sparkle', color: 'var(--success)' },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}><Icon name={k.icon} size={16} /><div className="label">{k.l}</div></div>
                <div className="val">{loading ? '…' : k.v}</div>
              </div>
            ))}
          </div>

          {/* Фильтр по преподавателю */}
          {teachers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '.1em', flexShrink: 0 }}>Преподаватель</span>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                <select
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  style={{
                    appearance: 'none', WebkitAppearance: 'none',
                    padding: '6px 32px 6px 12px', borderRadius: 10,
                    border: teacherId ? '1.5px solid var(--purple)' : '1.5px solid var(--border)',
                    background: teacherId ? 'var(--purple-tint)' : 'var(--bg-cream-soft)',
                    color: teacherId ? 'var(--purple-deep)' : 'var(--ink)',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', outline: 'none',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <option value="">Все преподаватели</option>
                  {teachers.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                  ))}
                </select>
              </div>
              {teacherId && (
                <button onClick={() => setTeacherId('')} style={{ padding: '6px 10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Сбросить
                </button>
              )}
            </div>
          )}

          {!loading && students.length === 0 && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>Учеников пока нет</div>
          )}
          {loading && (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>Загрузка...</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {students.map(s => (
              <StudentCard
                key={s.id}
                s={s}
                onMessage={s2 => navigate('/messages', { state: { userId: s2.id, teacherName: s2.name, teacherInitials: s2.initials } })}
                onSchedule={setScheduleFor}
                extraActions={<>
                  <button className="ps-btn ps-btn-outline ps-btn-sm" onClick={() => setAssign(s)}><Icon name="plus" size={12} /> Преподаватель</button>
                  <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => setLink(s)}><Icon name="users" size={12} /> Родитель</button>
                </>}
              />
            ))}
          </div>
        </div>
      </main>

      {assign && <AssignModal student={assign} onClose={() => setAssign(null)} onDone={load} />}
      {link && <LinkParentModal student={link} onClose={() => setLink(null)} onDone={load} />}
      {scheduleFor && (
        <ScheduleLessonModal
          student={scheduleFor}
          teachers={teachers}
          defaultTeacherId={teacherId || ''}
          initialDate={null}
          onClose={() => setScheduleFor(null)}
          onDone={load}
        />
      )}
    </div>
  )
}

function ManagerStudents() {
  const { sideRole } = useApp()
  const navigate = useNavigate()
  const [teachers, setTeachers]       = useState([])
  const [teacherId, setTeacherId]     = useState('')
  const [students, setStudents]       = useState([])
  const [loading, setLoading]         = useState(false)
  const [scheduleFor, setScheduleFor] = useState(null)

  useEffect(() => {
    api.get('/api/manager/teachers').then(setTeachers).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const req = teacherId
      ? api.get(`/api/manager/teacher/${teacherId}/students`)
      : adminApi.students()
    req
      .then(r => setStudents(Array.isArray(r) ? r : []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [teacherId])

  const selectedTeacher = teachers.find(t => String(t.id) === String(teacherId))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Ученики" />
        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего учеников',   v: students.length,                         icon: 'users',   color: 'var(--purple-deep)' },
              { l: 'С преподавателем', v: students.filter(s => s.teachers || selectedTeacher).length, icon: 'sparkle', color: 'var(--success)' },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} />
                  <div className="label">{k.l}</div>
                </div>
                <div className="val">{loading ? '…' : k.v}</div>
              </div>
            ))}
          </div>

          {/* Фильтр по преподавателю */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Преподаватель</span>
            <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream-soft)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
              <button
                onClick={() => setTeacherId('')}
                style={{
                  padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                  border: 'none', cursor: 'pointer', transition: 'all .12s',
                  background: !teacherId ? 'var(--purple)' : 'transparent',
                  color: !teacherId ? '#fff' : 'var(--ink-muted)',
                }}
              >Все</button>
              {teachers.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTeacherId(String(t.id))}
                  style={{
                    padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                    border: 'none', cursor: 'pointer', transition: 'all .12s',
                    background: teacherId === String(t.id) ? 'var(--purple)' : 'transparent',
                    color: teacherId === String(t.id) ? '#fff' : 'var(--ink-muted)',
                  }}
                >{t.name}</button>
              ))}
            </div>
          </div>

          {/* Список */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>Загрузка...</div>
          ) : students.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
              {teacherId ? 'У этого преподавателя пока нет учеников' : 'Учеников пока нет'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {students.map(s => (
                <StudentCard
                  key={s.id}
                  s={s}
                  onMessage={s2 => navigate('/messages', { state: { userId: s2.id, teacherName: s2.name, teacherInitials: s2.initials } })}
                  onSchedule={setScheduleFor}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {scheduleFor && (
        <ScheduleLessonModal
          student={scheduleFor}
          teachers={teachers}
          defaultTeacherId={teacherId || ''}
          initialDate={null}
          onClose={() => setScheduleFor(null)}
          onDone={() => {}}
        />
      )}
    </div>
  )
}

export default function StudentsPage() {
  const { role } = useApp()
  if (role === 'admin') return <AdminStudents />
  if (role === 'manager') return <ManagerStudents />
  return <TeacherStudents />
}
