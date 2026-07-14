import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar  from '../components/TopBar'
import Icon    from '../components/Icon'
import { useApp } from '../context/AppContext'
import { adminApi } from '../api/admin'
import LeadModal, { LEAD_STATUS } from '../components/LeadModal'
import SlideTabs from '../components/SlideTabs'

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
        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
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

          {/* Фильтры по статусу */}
          <div style={{ alignSelf: 'flex-start' }}>
            <SlideTabs
              size="sm"
              value={filter}
              onChange={setFilter}
              tabs={FILTERS.map(f => ({ id: f.id, label: f.label + (f.id !== 'all' && count(f.id) > 0 ? ` · ${count(f.id)}` : '') }))}
            />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
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
    </div>
  )
}
