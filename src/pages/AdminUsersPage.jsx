import { useState, useEffect } from 'react'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'
import { toast } from '../components/Toast'
import { adminApi } from '../api/admin'

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

export default function AdminUsersPage() {
  const { sideRole } = useApp()
  const [users, setUsers] = useState([])
  const [tab, setTab]     = useState('all')
  const [modal, setModal] = useState(false)
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
            <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-cream-soft)', borderRadius: 999, border: '1px solid var(--border)', gap: 2 }}>
              {TABS.map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: tab === tb.id ? 'var(--purple)' : 'transparent',
                  color: tab === tb.id ? '#fff' : 'var(--ink-muted)',
                }}>{tb.label}</button>
              ))}
            </div>
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
                        <div className="ps-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{u.initials}</div>
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
                      <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => toggleActive(u)}>
                        {u.active ? 'Отключить' : 'Включить'}
                      </button>
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
    </div>
  )
}
