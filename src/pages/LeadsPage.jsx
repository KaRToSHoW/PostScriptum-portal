import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'
import { leadApi } from '../api/leads'
import LeadModal, { LEAD_STATUS } from '../components/LeadModal'
import SlideTabs from '../components/SlideTabs'
import { toast } from '../components/Toast'

/* ── Ручное создание заявки (звонок, соцсети, рекомендация) ────── */
function CreateLeadModal({ onClose, onDone }) {
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [email, setEmail]     = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!name.trim())                   { setError('Укажите имя'); return }
    if (!phone.trim() && !email.trim()) { setError('Нужен телефон или email'); return }
    setError(''); setLoading(true)
    try {
      await leadApi.create({ name: name.trim(), phone: phone.trim(), email: email.trim(), comment: comment.trim() })
      toast('Заявка создана ✓', 'success')
      onDone()
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось создать заявку')
    } finally {
      setLoading(false)
    }
  }

  const optional = { fontWeight: 600, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-dim)' }

  return (
    <div
      className="ps-m-pad"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'grid', placeItems: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)', padding: 20 }}
    >
      <div className="ps-m-full" style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '18px 24px', position: 'relative' }}>
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,.15)', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
            <Icon name="plus" size={13} style={{ transform: 'rotate(45deg)' }} />
          </button>
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>вручную · звонок, соцсети</span>
          <h3 className="ps-display ps-display-purple" style={{ fontSize: 19, margin: '4px 0 0' }}>Новая заявка</h3>
        </div>

        <form onSubmit={submit} noValidate style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>{error}</div>}
          <div>
            <label className="ps-input-label">ИМЯ</label>
            <input className="ps-input" type="text" placeholder="Как зовут клиента" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="ps-input-label">ТЕЛЕФОН</label>
            <input className="ps-input" type="tel" placeholder="+7 900 000-00-00" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="ps-input-label">EMAIL <span style={optional}>— необязательно</span></label>
            <input className="ps-input" type="email" placeholder="client@email.ru" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="ps-input-label">КОММЕНТАРИЙ <span style={optional}>— язык, откуда пришёл, удобное время</span></label>
            <textarea className="ps-input" rows={3} placeholder="Например: испанский, звонок, вечером" value={comment} onChange={e => setComment(e.target.value)} style={{ resize: 'vertical', minHeight: 60 }} />
          </div>
          <button type="submit" className="ps-btn ps-btn-primary" style={{ width: '100%', padding: '13px 22px', fontSize: 13, marginTop: 2 }} disabled={loading}>
            {loading ? 'Создаём...' : <>Создать заявку <Icon name="arrow" size={13} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}

const FILTERS = [
  { id: 'all',         label: 'Все',          match: () => true },
  { id: 'NEW',         label: 'Новые',        match: l => l.status === 'NEW' },
  { id: 'IN_PROGRESS', label: 'В работе',     match: l => l.status === 'IN_PROGRESS' },
  { id: 'CONVERTED',   label: 'Ученики',      match: l => l.status === 'CONVERTED' },
  { id: 'LOST',        label: 'Отклонённые',  match: l => l.status === 'LOST' },
]

export default function LeadsPage() {
  const { sideRole } = useApp()
  const [leads, setLeads]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [modal, setModal]     = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const fn = e => setIsMobile(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const load = useCallback(() => {
    adminApi.leads()
      .then(d => setLeads(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const count = st => leads.filter(l => l.status === st).length
  const filtered = leads.filter(FILTERS.find(f => f.id === filter).match)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Заявки" />
        <div className="ps-m-pad" style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div className="ps-m-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Всего заявок',    v: leads.length,        icon: 'inbox',   color: 'var(--purple-deep)' },
              { l: 'Новые',           v: count('NEW'),        icon: 'sparkle', color: 'var(--orange-deep)' },
              { l: 'В работе',        v: count('IN_PROGRESS'),icon: 'chat',    color: 'var(--info)' },
              { l: 'Стали учениками', v: count('CONVERTED'),  icon: 'check',   color: 'var(--success)' },
            ].map((k, i) => (
              <div key={i} className="ps-kpi">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: k.color }}>
                  <Icon name={k.icon} size={16} /><div className="label">{k.l}</div>
                </div>
                <div className="val">{loading ? '…' : k.v}</div>
              </div>
            ))}
          </div>

          {/* Фильтры по статусу + создание заявки вручную */}
          <div className="ps-m-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isMobile ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FILTERS.map(f => {
                const active = filter === f.id
                const n = f.id === 'all' ? leads.length : count(f.id)
                return (
                  <span
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    style={{
                      padding: '7px 13px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      background: active ? 'var(--purple)' : '#fff',
                      color: active ? '#fff' : 'var(--ink-muted)',
                      border: `1px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
                    }}
                  >{f.label}{n > 0 ? ` · ${n}` : ''}</span>
                )
              })}
            </div>
          ) : (
            <div style={{ maxWidth: '100%' }}>
              <SlideTabs
                size="sm"
                value={filter}
                onChange={setFilter}
                tabs={FILTERS.map(f => ({ id: f.id, label: f.label + (f.id !== 'all' && count(f.id) > 0 ? ` · ${count(f.id)}` : '') }))}
              />
            </div>
          )}
          <div style={{ flex: 1 }} />
          <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={13} /> Новая заявка
          </button>
          </div>

          {/* Список заявок */}
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="ps-card" style={{ padding: 48, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
              {leads.length === 0
                ? 'Заявок пока нет. Они приходят с формы «Запись через менеджера» (клик по логотипу на странице входа).'
                : 'Нет заявок по этому фильтру'}
            </div>
          ) : (
            <div className="ps-m-1col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filtered.map(l => {
                const st = LEAD_STATUS[l.status] ?? LEAD_STATUS.NEW
                return (
                  <div key={l.id} onClick={() => setModal(l)} className="ps-card ps-card-lift" style={{ padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {l.lang
                        ? <span className={`ps-flag ps-flag-${l.lang}`} />
                        : <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--purple-soft)', flexShrink: 0 }} />}
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                      <span className={`ps-chip ps-chip-${st.chip}`}>{st.label}</span>
                    </div>
                    {l.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2)', fontWeight: 700 }}>
                        <Icon name="phone" size={13} /> {l.phone}
                      </div>
                    )}
                    {(l.comment || l.details) && (
                      <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {l.comment || l.details}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{l.source ? `${l.source} · ` : ''}{l.receivedAt}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--purple-deep)' }}>Обработать →</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {modal && <LeadModal lead={modal} onClose={() => setModal(null)} onChanged={load} />}
      {createOpen && <CreateLeadModal onClose={() => setCreateOpen(false)} onDone={load} />}
    </div>
  )
}
