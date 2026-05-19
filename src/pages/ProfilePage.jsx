import { useState } from 'react'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'

const TIMEZONES = ['Europe/Moscow','Europe/Kaliningrad','Asia/Yekaterinburg','Asia/Novosibirsk','Asia/Krasnoyarsk','Asia/Irkutsk','Asia/Yakutsk','Asia/Vladivostok']
const LOCALES   = [{ v:'ru', l:'Русский' }, { v:'en', l:'English' }, { v:'fr', l:'Français' }]

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)',
        background: 'var(--bg-cream-soft)', fontSize: 14, fontWeight: 600,
        color: 'var(--ink)', outline: 'none', width: '100%',
        transition: 'border-color .15s',
      }}
      onFocus={e  => e.target.style.borderColor = 'var(--purple)'}
      onBlur={e   => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 16 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 999, position: 'relative', flexShrink: 0,
          background: checked ? 'var(--purple)' : 'var(--border)',
          transition: 'background .2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
        }} />
      </div>
    </label>
  )
}

export default function ProfilePage() {
  const { user, sideRole } = useApp()

  const [name,     setName]     = useState(user?.name     ?? 'Анна Соколова')
  const [email,    setEmail]    = useState('anna@example.ru')
  const [phone,    setPhone]    = useState('+7 999 123-45-67')
  const [tz,       setTz]       = useState('Europe/Moscow')
  const [locale,   setLocale]   = useState('ru')

  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush,  setNotifPush]  = useState(true)
  const [notifSms,   setNotifSms]   = useState(false)
  const [reminder,   setReminder]   = useState('24')

  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [repPwd, setRepPwd] = useState('')

  const [saved,  setSaved]  = useState(false)
  const [section, setSection] = useState('profile')

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)

  const SECTIONS = [
    { id: 'profile',  label: 'Личные данные',  icon: 'user'     },
    { id: 'notif',    label: 'Уведомления',     icon: 'warning'  },
    { id: 'security', label: 'Безопасность',    icon: 'shield'   },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Профиль" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Hero */}
          <div className="ps-card-purple" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,.2)', border: '3px solid rgba(255,255,255,.4)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <h2 className="ps-display ps-display-purple" style={{ fontSize: 30, margin: '0 0 6px' }}>{name}</h2>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', display: 'flex', gap: 16 }}>
                <span>Ученик</span>
                <span>·</span>
                <span>{email}</span>
                <span>·</span>
                <span>{tz}</span>
              </div>
            </div>
            <button className="ps-btn ps-btn-sm" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', flexShrink: 0 }}>
              <Icon name="upload" size={13} /> Сменить фото
            </button>
            <div style={{ position: 'absolute', right: -20, top: -10, fontFamily: 'var(--font-display)', fontSize: 200, color: 'rgba(255,255,255,.06)', fontWeight: 900, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
              P.S.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 22, alignItems: 'start' }}>

            {/* Навигация */}
            <div className="ps-card" style={{ padding: 10 }}>
              {SECTIONS.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                    background: section === s.id ? 'var(--purple-soft)' : 'transparent',
                    color:      section === s.id ? 'var(--purple-deep)' : 'var(--ink-muted)',
                    fontWeight: 800, fontSize: 14, transition: 'background .12s',
                  }}
                >
                  <Icon name={s.icon} size={16} />
                  {s.label}
                </div>
              ))}
            </div>

            {/* Содержимое */}
            {section === 'profile' && (
              <div className="ps-card" style={{ padding: 28 }}>
                <div style={{ marginBottom: 24 }}>
                  <span className="ps-eyebrow">аккаунт</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Личные данные</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <Field label="Имя и фамилия">
                    <Input value={name} onChange={setName} placeholder="Имя Фамилия" />
                  </Field>
                  <Field label="Email">
                    <Input value={email} onChange={setEmail} type="email" placeholder="email@example.com" />
                  </Field>
                  <Field label="Телефон">
                    <Input value={phone} onChange={setPhone} placeholder="+7 999 000-00-00" />
                  </Field>
                  <Field label="Часовой пояс">
                    <select
                      value={tz} onChange={e => setTz(e.target.value)}
                      style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-cream-soft)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', width: '100%' }}
                    >
                      {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </Field>
                  <Field label="Язык интерфейса">
                    <div style={{ display: 'flex', gap: 8 }}>
                      {LOCALES.map(l => (
                        <button
                          key={l.v}
                          onClick={() => setLocale(l.v)}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all .12s',
                            background: locale === l.v ? 'var(--purple)' : 'var(--bg-cream-soft)',
                            color:      locale === l.v ? '#fff' : 'var(--ink-muted)',
                            border:     locale === l.v ? '1.5px solid var(--purple)' : '1.5px solid var(--border)',
                          }}
                        >{l.l}</button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
                  <button className="ps-btn ps-btn-primary" onClick={handleSave}>
                    <Icon name="check" size={14} /> Сохранить
                  </button>
                  {saved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--success)', fontWeight: 800 }}>
                      <Icon name="check" size={14} /> Сохранено
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'notif' && (
              <div className="ps-card" style={{ padding: 28 }}>
                <div style={{ marginBottom: 24 }}>
                  <span className="ps-eyebrow">настройки</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Уведомления</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Email-уведомления',    val: notifEmail, set: setNotifEmail },
                    { label: 'Push-уведомления',      val: notifPush,  set: setNotifPush  },
                    { label: 'SMS-уведомления',        val: notifSms,   set: setNotifSms   },
                  ].map((n, i, arr) => (
                    <div key={n.label} style={{ padding: '16px 0', borderBottom: i < arr.length-1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <Toggle checked={n.val} onChange={n.set} label={n.label} />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24 }}>
                  <Field label="Напоминание об уроке (за сколько часов)">
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['1','2','12','24','48'].map(h => (
                        <button
                          key={h}
                          onClick={() => setReminder(h)}
                          style={{
                            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                            background: reminder === h ? 'var(--purple)' : 'var(--bg-cream-soft)',
                            color:      reminder === h ? '#fff' : 'var(--ink-muted)',
                            border:     reminder === h ? '1.5px solid var(--purple)' : '1.5px solid var(--border)',
                          }}
                        >{h}ч</button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
                  <button className="ps-btn ps-btn-primary" onClick={handleSave}>
                    <Icon name="check" size={14} /> Сохранить
                  </button>
                  {saved && (
                    <span style={{ marginLeft: 14, fontSize: 13, color: 'var(--success)', fontWeight: 800 }}>
                      ✓ Сохранено
                    </span>
                  )}
                </div>
              </div>
            )}

            {section === 'security' && (
              <div className="ps-card" style={{ padding: 28 }}>
                <div style={{ marginBottom: 24 }}>
                  <span className="ps-eyebrow">безопасность</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Смена пароля</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                  <Field label="Текущий пароль">
                    <Input value={curPwd} onChange={setCurPwd} type="password" placeholder="••••••••" />
                  </Field>
                  <Field label="Новый пароль">
                    <Input value={newPwd} onChange={setNewPwd} type="password" placeholder="••••••••" />
                  </Field>
                  <Field label="Повторите новый пароль">
                    <Input value={repPwd} onChange={setRepPwd} type="password" placeholder="••••••••" />
                  </Field>
                </div>

                {newPwd && repPwd && newPwd !== repPwd && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--danger-soft)', fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>
                    Пароли не совпадают
                  </div>
                )}

                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <button
                    className="ps-btn ps-btn-primary"
                    disabled={!curPwd || !newPwd || newPwd !== repPwd}
                    style={{ width: 'fit-content', opacity: (!curPwd || !newPwd || newPwd !== repPwd) ? 0.5 : 1 }}
                    onClick={handleSave}
                  >
                    <Icon name="shield" size={14} /> Сменить пароль
                  </button>

                  <div style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--warning-soft)', fontSize: 13, color: 'var(--warning)', fontWeight: 700, lineHeight: 1.5 }}>
                    ⚠ После смены пароля вы будете автоматически выйдены из всех устройств
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
