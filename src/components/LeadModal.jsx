import { useState, useEffect } from 'react'
import Icon from './Icon'
import { adminApi } from '../api/admin'
import { api } from '../api/client'
import { toast } from './Toast'

const LANGS = [
  { code: 'fr', name: 'Французский' },
  { code: 'en', name: 'Английский' },
  { code: 'de', name: 'Немецкий' },
  { code: 'es', name: 'Испанский' },
  { code: 'it', name: 'Итальянский' },
]

// Метки статусов заявок (enum lead_status на бэке)
export const LEAD_STATUS = {
  NEW:             { label: 'Новая',        chip: 'orange' },
  IN_PROGRESS:     { label: 'В работе',     chip: 'blue'   },
  TRIAL_SCHEDULED: { label: 'Пробный урок', chip: 'purple' },
  CONVERTED:       { label: 'Ученик',       chip: 'green'  },
  LOST:            { label: 'Отклонена',    chip: 'gray'   },
}

/* ============================================================
   Обработка заявки: связаться (телефон) → создать аккаунт → выдать логин/пароль
   ============================================================ */
export default function LeadModal({ lead, onClose, onChanged }) {
  const [busy, setBusy] = useState('')
  const [creds, setCreds] = useState(null)   // { email, password } после конвертации
  const [status, setLocalStatus] = useState(lead.status)

  // Заявка от уже зарегистрировавшегося ученика: аккаунт есть,
  // вместо «Создать аккаунт» — распределение к преподавателю
  const isRegistration = (lead.source || '').startsWith('Регистрация')
  const [assignOpen, setAssignOpen] = useState(false)
  const [teachers, setTeachers]     = useState([])
  const [teacherId, setTeacherId]   = useState('')
  const [langCode, setLangCode]     = useState(lead.lang || 'fr')
  const [assigned, setAssigned]     = useState(false)

  useEffect(() => {
    if (!assignOpen || teachers.length > 0) return
    api.get('/api/manager/teachers')
      .then(list => setTeachers(Array.isArray(list) ? list : []))
      .catch(() => toast('Не удалось загрузить преподавателей', 'error'))
  }, [assignOpen, teachers.length])

  // Языки — только те, что ведёт выбранный преподаватель
  const selTeacher   = teachers.find(t => String(t.id) === String(teacherId))
  const teacherLangs = selTeacher?.langCodes?.length
    ? LANGS.filter(l => selTeacher.langCodes.includes(l.code))
    : LANGS

  function pickTeacher(id) {
    setTeacherId(id)
    const t = teachers.find(x => String(x.id) === String(id))
    if (t?.langCodes?.length && !t.langCodes.includes(langCode)) {
      setLangCode(t.langCodes[0])
    }
  }

  async function assign() {
    if (!teacherId) { toast('Выберите преподавателя', 'warning'); return }
    setBusy('assign')
    try {
      await adminApi.assignLead(lead.id, { teacherId, languageCode: langCode })
      setAssigned(true)
      setLocalStatus('CONVERTED')
      onChanged?.()
    } catch (e) { toast(e.message || 'Не удалось распределить', 'error') }
    finally { setBusy('') }
  }

  const st = LEAD_STATUS[status] ?? LEAD_STATUS.NEW

  function copy(text) {
    navigator.clipboard?.writeText(text)
      .then(() => toast('Скопировано', 'success'))
      .catch(() => {})
  }

  async function setStatus(s) {
    setBusy(s)
    try {
      await adminApi.leadStatus(lead.id, s)
      toast(s === 'LOST' ? 'Заявка отклонена' : 'Взято в работу', 'success')
      setLocalStatus(s)
      onChanged?.()
      if (s === 'LOST') onClose()
    } catch (e) { toast(e.message || 'Ошибка', 'error') }
    finally { setBusy('') }
  }

  async function convert() {
    setBusy('convert')
    try {
      const r = await adminApi.convertLead(lead.id)
      setCreds({ email: r.email, password: r.password, emailed: r.emailed })
      onChanged?.()
    } catch (e) { toast(e.message || 'Не удалось создать аккаунт', 'error') }
    finally { setBusy('') }
  }

  const Row = ({ label, value, action }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
        {action}
      </div>
    </div>
  )

  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'grid', placeItems: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)', padding: 20 }}>
      <div className="ps-m-full" style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>

        <div className="ps-card-purple" style={{ padding: '18px 24px', position: 'relative' }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.15)', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon name="plus" size={13} style={{ transform: 'rotate(45deg)' }} />
          </button>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>заявка · {st.label}</span>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 0' }}>{lead.name}</h3>
        </div>

        {assigned ? (
          /* ── Ученик распределён к преподавателю ── */
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>✅</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Ученик распределён</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, background: 'var(--success-soft)', padding: '12px 14px', borderRadius: 10 }}>
              <b>{lead.name}</b> прикреплён к преподавателю{' '}
              <b>{teachers.find(t => String(t.id) === String(teacherId))?.name ?? ''}</b>{' '}
              ({LANGS.find(l => l.code === langCode)?.name?.toLowerCase()}). Оба получили уведомления.
            </div>
            <button className="ps-btn ps-btn-primary" style={{ justifyContent: 'center' }} onClick={onClose}>Готово</button>
          </div>
        ) : creds ? (
          /* ── Аккаунт создан: логин + пароль для передачи клиенту ── */
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>✅</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Аккаунт создан</div>
            </div>
            <div style={{ background: 'var(--bg-cream-soft)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Row label="Логин (email)" value={creds.email}
                action={<button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => copy(creds.email)}>Копировать</button>} />
              <Row label="Пароль" value={<code style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.04em', color: 'var(--purple-deep)' }}>{creds.password}</code>}
                action={<button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => copy(creds.password)}>Копировать</button>} />
            </div>
            {creds.emailed ? (
              <div style={{ fontSize: 12.5, color: '#2F5A3D', lineHeight: 1.5, background: 'var(--success-soft)', padding: '10px 14px', borderRadius: 10 }}>
                📧 Письмо с доступами отправлено на <b>{creds.email}</b>. Логин и пароль выше — на случай, если понадобится продиктовать.
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.5, background: 'var(--orange-tint)', padding: '10px 14px', borderRadius: 10 }}>
                📞 Передайте логин и пароль клиенту — по телефону, с которого связывались{lead.email ? `, или отправьте на ${lead.email}` : ''}. Пароль временный, клиент сменит его в настройках.
              </div>
            )}
            <button className="ps-btn ps-btn-primary" style={{ justifyContent: 'center' }} onClick={onClose}>Готово</button>
          </div>
        ) : (
          /* ── Данные заявки + действия ── */
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {lead.phone && (
              <Row label="Телефон" value={lead.phone}
                action={<a href={`tel:${lead.phone}`} className="ps-btn ps-btn-primary ps-btn-sm" style={{ textDecoration: 'none' }}><Icon name="phone" size={13} /> Позвонить</a>} />
            )}
            {lead.email && <Row label="Email" value={lead.email}
              action={<button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => copy(lead.email)}>Копировать</button>} />}
            {lead.details && <Row label="Детали" value={lead.details} />}
            {lead.comment && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Комментарий</span>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, background: 'var(--bg-cream-soft)', padding: '10px 12px', borderRadius: 10 }}>{lead.comment}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{lead.source ? `${lead.source} · ` : ''}{lead.receivedAt}</div>

            {/* Форма распределения: преподаватель + язык (для заявок-регистраций) */}
            {assignOpen && status !== 'CONVERTED' && (
              <div style={{ background: 'var(--purple-tint)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple-deep)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Преподаватель</span>
                  <select
                    value={teacherId}
                    onChange={e => pickTeacher(e.target.value)}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: '#fff', fontSize: 13.5, fontFamily: 'var(--font-body)', outline: 'none' }}
                  >
                    <option value="">— выберите —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.langs ? ` · ${t.langs}` : ''}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple-deep)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Язык</span>
                  <select
                    value={langCode}
                    onChange={e => setLangCode(e.target.value)}
                    disabled={!teacherId}
                    style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', background: teacherId ? '#fff' : 'var(--bg-cream-soft)', fontSize: 13.5, fontFamily: 'var(--font-body)', outline: 'none' }}
                  >
                    {teacherLangs.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                </div>
                <button className="ps-btn ps-btn-primary ps-btn-sm" disabled={!!busy} onClick={assign} style={{ justifyContent: 'center' }}>
                  <Icon name="check" size={13} /> {busy === 'assign' ? 'Назначаем...' : 'Назначить'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border-soft)', marginTop: 2 }}>
              {status === 'NEW' && (
                <button className="ps-btn ps-btn-outline ps-btn-sm" disabled={!!busy} onClick={() => setStatus('IN_PROGRESS')}>
                  <Icon name="check" size={13} /> В работу
                </button>
              )}
              {status !== 'CONVERTED' && (isRegistration ? (
                !assignOpen && (
                  <button className="ps-btn ps-btn-primary ps-btn-sm" disabled={!!busy} onClick={() => setAssignOpen(true)}>
                    <Icon name="users" size={13} /> Распределить к преподавателю
                  </button>
                )
              ) : (
                <button className="ps-btn ps-btn-primary ps-btn-sm" disabled={!!busy} onClick={convert}>
                  <Icon name="users" size={13} /> {busy === 'convert' ? 'Создаём...' : 'Создать аккаунт'}
                </button>
              ))}
              {status !== 'CONVERTED' && status !== 'LOST' && (
                <button className="ps-btn ps-btn-ghost ps-btn-sm" disabled={!!busy} onClick={() => setStatus('LOST')} style={{ color: 'var(--danger)' }}>
                  Отклонить
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
