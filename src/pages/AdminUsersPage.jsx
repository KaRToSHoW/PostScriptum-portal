import { useState, useEffect } from 'react'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'
import { toast } from '../components/Toast'
import { adminApi } from '../api/admin'
import SlideTabs from '../components/SlideTabs'

const ROLE_LABEL = { STUDENT: 'Ученик', PARENT: 'Родитель', TEACHER: 'Преподаватель', MANAGER: 'Менеджер', ADMIN: 'Админ' }
const ROLE_CHIP  = { STUDENT: 'blue', PARENT: 'green', TEACHER: 'orange', MANAGER: 'purple', ADMIN: 'red' }
const ROLES = ['STUDENT', 'PARENT', 'TEACHER', 'MANAGER', 'ADMIN']

const TABS = [
  { id: 'all',     label: 'Все',           match: () => true },
  { id: 'STUDENT', label: 'Ученики',       match: u => u.role === 'STUDENT' },
  { id: 'TEACHER', label: 'Преподаватели', match: u => u.role === 'TEACHER' },
  { id: 'PARENT',  label: 'Родители',      match: u => u.role === 'PARENT' },
  { id: 'team',    label: 'Команда',       match: u => u.role === 'MANAGER' || u.role === 'ADMIN' },
]

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' })
  const [busy, setBusy] = useState(false)

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast('Заполните имя, email и пароль', 'warning'); return
    }
    setBusy(true)
    try {
      await adminApi.createUser(form)
      toast('Пользователь создан ✓', 'success')
      onCreated()
      onClose()
    } catch (e) {
      toast(e.message || 'Ошибка создания', 'error')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 460, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>новый аккаунт</span>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 0' }}>Создать пользователя</h3>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Имя и фамилия"><input className="ps-input" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Иван Иванов" /></Field>
          <Field label="Email"><input className="ps-input" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="user@test.ru" /></Field>
          <Field label="Пароль"><input className="ps-input" type="text" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="минимум 6 символов" /></Field>
          <Field label="Роль">
            <select className="ps-input" value={form.role} onChange={e => upd('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
            <button className="ps-btn ps-btn-primary" onClick={submit} disabled={busy} style={{ flex: 1, justifyContent: 'center' }}>
              {busy ? 'Создание...' : 'Создать'}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

function DeleteUserModal({ user, onClose, onDeleted }) {
  const [phase, setPhase]       = useState('confirm')   // 'confirm' | 'blocked'
  const [blockers, setBlockers] = useState([])
  const [busy, setBusy]         = useState(false)

  async function doDelete(force) {
    setBusy(true)
    try {
      await adminApi.deleteUser(user.id, force)
      toast(force ? 'Пользователь и все его данные удалены' : 'Пользователь удалён', 'success')
      onDeleted()
      onClose()
    } catch (e) {
      const bl = e.status === 409 ? e.body?.blockers : null
      if (bl?.length) { setBlockers(bl); setPhase('blocked') }
      else toast(e.message || 'Не удалось удалить', 'error')
    } finally { setBusy(false) }
  }

  const btnStyle = { flex: 1, justifyContent: 'center', background: 'var(--danger)', color: '#fff', border: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div style={{ width: 460, maxWidth: '92vw', background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: 'var(--danger)' }}>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.75)' }}>удаление аккаунта</span>
          <h3 className="ps-display" style={{ fontSize: 20, margin: '4px 0 0', color: '#fff' }}>Удалить «{user.name}»?</h3>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {phase === 'confirm' ? (
            <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>
              Аккаунт <b>{user.name}</b> ({ROLE_LABEL[user.role] || user.role}) будет удалён без возможности восстановления.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>
                У пользователя есть связанные данные — обычное удаление невозможно. Что привязано к аккаунту:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--bg-cream)', borderRadius: 14, padding: '6px 14px' }}>
                {blockers.map(b => (
                  <div key={b.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{b.label}</span>
                    <span className="ps-chip ps-chip-red" style={{ fontSize: 11 }}>{b.count}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--danger-soft)', color: '#7A322C', borderRadius: 12, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.5 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Принудительное удаление сотрёт все эти данные безвозвратно.</span>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 2 }}>
            <button className="ps-btn ps-btn-sm" onClick={() => doDelete(phase === 'blocked')} disabled={busy} style={btnStyle}>
              {busy ? 'Удаление…' : phase === 'blocked' ? 'Удалить принудительно' : 'Удалить'}
            </button>
            <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={onClose} disabled={busy}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { sideRole } = useApp()
  const [users, setUsers] = useState([])
  const [tab, setTab]     = useState('all')
  const [modal, setModal] = useState(false)
  const [delUser, setDelUser] = useState(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminApi.users()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function changeRole(id, role) {
    try { await adminApi.setRole(id, role); toast('Роль обновлена', 'success'); load() }
    catch (e) { toast(e.message || 'Ошибка', 'error') }
  }
  async function toggleActive(u) {
    try { await adminApi.setActive(u.id, !u.active); load() }
    catch (e) { toast(e.message || 'Ошибка', 'error') }
  }
  const filtered = users.filter(TABS.find(t => t.id === tab).match)
  const count = role => users.filter(u => u.role === role).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Пользователи" />
        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего',          v: users.length,       icon: 'users',   color: 'var(--purple-deep)' },
              { l: 'Учеников',       v: count('STUDENT'),   icon: 'user',    color: 'var(--info)' },
              { l: 'Преподавателей', v: count('TEACHER'),   icon: 'sparkle', color: 'var(--orange-deep)' },
              { l: 'Родителей',      v: count('PARENT'),    icon: 'shield',  color: 'var(--success)' },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} /><div className="label">{k.l}</div>
                </div>
                <div className="val">{loading ? '…' : k.v}</div>
              </div>
            ))}
          </div>

          {/* Тулбар */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <SlideTabs
              size="sm"
              value={tab}
              onChange={setTab}
              tabs={TABS.map(tb => ({ id: tb.id, label: tb.label }))}
            />
            <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setModal(true)}>
              <Icon name="plus" size={13} /> Новый пользователь
            </button>
          </div>

          {/* Таблица */}
          <div className="ps-card" style={{ padding: 8 }}>
            <table className="ps-table">
              <thead><tr>
                <th>Пользователь</th><th>Email</th><th>Роль</th><th>Записей</th><th>Статус</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="ps-avatar" style={{ width: 32, height: 32, fontSize: 11, overflow: 'hidden' }}>
                          {u.avatarUrl
                            ? <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : u.initials}
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink-muted)' }}>{u.email}</td>
                    <td>
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        className={`ps-chip ps-chip-${ROLE_CHIP[u.role]}`}
                        style={{ border: 'none', cursor: 'pointer', fontWeight: 700, padding: '4px 8px' }}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td>{u.enrollments ?? 0}</td>
                    <td>
                      <span className={`ps-chip ps-chip-${u.active ? 'green' : 'gray'}`}>
                        {u.active ? 'Активен' : 'Отключён'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => toggleActive(u)}>
                          {u.active ? 'Отключить' : 'Включить'}
                        </button>
                        <button
                          className="ps-btn ps-btn-sm"
                          onClick={() => setDelUser(u)}
                          title="Удалить пользователя"
                          style={{ background: 'var(--danger-soft)', color: 'var(--danger)', padding: '0 10px', height: 30 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-muted)' }}>Нет пользователей</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {modal && <CreateUserModal onClose={() => setModal(false)} onCreated={load} />}
      {delUser && <DeleteUserModal user={delUser} onClose={() => setDelUser(null)} onDeleted={load} />}
    </div>
  )
}
