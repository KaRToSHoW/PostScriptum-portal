import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import BuyModal from '../components/BuyModal'
import { useApp } from '../context/AppContext'
import { subscriptionsApi } from '../api/subscriptions'
import { parentApi } from '../api/parent'
import { profileApi } from '../api/profile'

const LANG_COLORS = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--info)', es: 'var(--success)' }
const LANG_SOFT   = { fr: 'var(--purple-soft)', en: 'var(--orange-soft)', de: 'var(--info-soft)', es: 'var(--success-soft)' }

/** Ученик может сам покупать абонементы с этого возраста; младше — покупает родитель (как на бэкенде). */
const SELF_PURCHASE_AGE = 18

const fmtRub = v => `₽ ${Number(v ?? 0).toLocaleString('ru-RU')}`

function ageOf(birthDate) {
  if (!birthDate) return null
  const b = parseDay(birthDate)
  if (!b) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
  return age
}

// дата из API: 'yyyy-MM-dd' (без времени — берём середину/конец дня, чтобы не съехать на сутки) или метка времени
function parseDay(v, time = 'T12:00:00') {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'string' && v.length === 10) return new Date(v + time)
  const d = new Date(v)
  return isNaN(d) ? null : d
}

function mapSub(s) {
  const end   = parseDay(s.endDate, 'T23:59:59')
  const start = parseDay(s.startDate)
  return {
    id: s.id, lang: s.lang, langName: s.langName || 'Любой язык', planName: s.planName,
    used: s.used ?? 0, total: s.total ?? 0, status: s.status,
    expires: end ? end.toLocaleDateString('ru-RU') : '—',
    daysLeft: end ? Math.max(0, Math.ceil((end - new Date()) / 864e5)) : null,
    startDate: start ? start.toLocaleDateString('ru-RU') : '',
    price: fmtRub(s.price), priceNum: Number(s.price ?? 0),
    purchasedBy: s.purchasedBy,
  }
}

function mapPlan(p) {
  const lessons = p.lessonCount ?? p.lesson_count
  return {
    id: p.id, lang: p.lang || null, langName: p.langName || p.lang_name || 'Любой язык',
    lessons, price: fmtRub(p.price),
    perLesson: fmtRub(Math.round(p.price / (lessons || 1))),
    popular: p.popular ?? false,
  }
}

function ActiveCard({ sub, onRenew, onCalendar, canBuy }) {
  const pct   = sub.total ? Math.round(sub.used / sub.total * 100) : 0
  const color = LANG_COLORS[sub.lang] ?? 'var(--purple)'
  const soft  = LANG_SOFT[sub.lang] ?? 'var(--purple-soft)'
  const urgent = sub.daysLeft !== null && sub.daysLeft <= 7

  return (
    <div className="ps-m-pad" style={{ padding: 24, borderRadius: 20, border: `2px solid ${color}`, background: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: soft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <span className={`ps-flag ps-flag-${sub.lang}`} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {sub.langName} · {sub.total} уроков
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>
              {sub.planName}{sub.purchasedBy ? ` · оплатил(а): ${sub.purchasedBy}` : ''}
            </div>
          </div>
        </div>
        <span className="ps-chip ps-chip-green">Активный</span>
      </div>

      {/* Прогресс уроков */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 800 }}>
          <span style={{ color: 'var(--ink-muted)' }}>Использовано уроков</span>
          <span style={{ color }}>{sub.used} / {sub.total}</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={sub.total} aria-valuenow={sub.used} aria-label="Использовано уроков"
          style={{ height: 8, background: soft, borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--ink-muted)' }}>{sub.total - sub.used} уроков осталось</span>
          <span style={{ color: urgent ? 'var(--danger)' : 'var(--ink-muted)', fontWeight: urgent ? 800 : 600 }}>
            {urgent ? '⚠ ' : ''}Действует до {sub.expires}{sub.daysLeft !== null ? ` · ещё ${sub.daysLeft} дн.` : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border-soft)' }}>
        {canBuy && (
          <button className="ps-btn ps-btn-primary ps-btn-sm" style={{ background: color, borderColor: color }} onClick={onRenew}>
            <Icon name="plus" size={13} /> Продлить
          </button>
        )}
        <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={onCalendar}>
          <Icon name="calendar" size={13} /> Расписание
        </button>
      </div>
    </div>
  )
}

/*
  Абонементы одного ученика. Ученик видит свои; родитель — выбранного ребёнка (childId)
  и может купить ему абонемент.
*/
function SubscriptionsContent({ childId = null, childName = null, canBuy, buyNote }) {
  const navigate = useNavigate()
  const [buyLang, setBuyLang]   = useState(null)
  const [buyModal, setBuyModal] = useState(null)
  const [subs, setSubs]         = useState(null)
  const [plans, setPlans]       = useState(null)
  const buyRef = useRef(null)

  const loadSubs = useCallback(() => {
    const req = childId ? parentApi.childSubscriptions(childId) : subscriptionsApi.list()
    return req.then(data => setSubs((data || []).map(mapSub))).catch(() => setSubs([]))
  }, [childId])

  useEffect(() => { loadSubs() }, [loadSubs])

  useEffect(() => {
    subscriptionsApi.plans()
      .then(data => setPlans((data || []).map(mapPlan)))
      .catch(() => setPlans([]))
  }, [])

  const activeList = (subs || []).filter(s => s.status === 'ACTIVE')
  const history    = (subs || []).filter(s => s.status !== 'ACTIVE')
  const totalSpent = (subs || []).reduce((s, h) => s + h.priceNum, 0)

  const langs = [...new Map((plans || []).filter(p => p.lang).map(p => [p.lang, p.langName])).entries()]
  const lang  = buyLang ?? langs[0]?.[0] ?? null
  const filteredPlans = (plans || []).filter(p => !p.lang || !lang || p.lang === lang)
  const nearest = [...activeList].sort((a, b) => (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9))[0]

  function scrollToBuy() {
    buyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="ps-m-pad" style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* KPI */}
      <div className="ps-m-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Активных абонементов', v: activeList.length, d: 'сейчас', icon: 'bookmark', color: 'var(--purple-deep)' },
          { l: 'Уроков осталось', v: activeList.reduce((s, a) => s + (a.total - a.used), 0), d: 'по всем курсам', icon: 'calendar', color: 'var(--success)' },
          { l: 'Ближайшее истечение', v: nearest?.expires ?? '—', d: nearest?.langName ?? '', icon: 'warning', color: 'var(--orange-deep)' },
          { l: 'Потрачено всего', v: fmtRub(totalSpent), d: 'за всё время', icon: 'wallet', color: 'var(--ink-muted)' },
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

      <div className="ps-m-1col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22, alignItems: 'start' }}>

        {/* Левая колонка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Активные */}
          <section className="ps-card ps-m-pad" style={{ padding: 24 }} aria-labelledby="subs-active">
            <div style={{ marginBottom: 18 }}>
              <span className="ps-eyebrow">текущие</span>
              <h3 id="subs-active" className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Активные абонементы</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subs === null && <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Загрузка...</div>}
              {subs !== null && activeList.length === 0 && (
                <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--purple-soft)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="bookmark" size={24} style={{ color: 'var(--purple)' }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Нет активных абонементов</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
                    {canBuy ? 'Выберите язык и тариф в разделе «Новый абонемент»' : buyNote}
                  </div>
                  {canBuy && (
                    <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={scrollToBuy}>
                      <Icon name="plus" size={13} /> Купить абонемент
                    </button>
                  )}
                </div>
              )}
              {activeList.map(sub => (
                <ActiveCard key={sub.id} sub={sub} canBuy={canBuy} onRenew={scrollToBuy} onCalendar={() => navigate('/calendar')} />
              ))}
            </div>
          </section>

          {/* История */}
          <section className="ps-card ps-m-pad" style={{ padding: 24 }} aria-labelledby="subs-history">
            <div style={{ marginBottom: 16 }}>
              <span className="ps-eyebrow">история</span>
              <h3 id="subs-history" className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Прошлые абонементы</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {subs !== null && history.length === 0 && (
                <div style={{ color: 'var(--ink-muted)', fontSize: 13, padding: '12px 0' }}>Завершённых абонементов пока нет</div>
              )}
              {history.map((h, i, arr) => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: LANG_SOFT[h.lang] || 'var(--bg-cream)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <span className={`ps-flag ps-flag-${h.lang}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{h.langName} · {h.total} уроков</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                      {h.startDate} — {h.expires} · использовано {h.used} из {h.total}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)', flexShrink: 0 }}>{h.price}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Правая колонка — купить */}
        <section ref={buyRef} className="ps-card-purple ps-m-pad" style={{ padding: 24, position: 'relative', overflow: 'hidden' }} aria-labelledby="subs-buy">
          <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>{childName ? `покупка для: ${childName}` : 'покупка'}</span>
          <h3 id="subs-buy" className="ps-display ps-display-purple" style={{ fontSize: 24, margin: '6px 0 20px' }}>Новый абонемент</h3>

          {!canBuy ? (
            <div style={{ display: 'flex', gap: 10, padding: 16, borderRadius: 14, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 13, lineHeight: 1.5 }}>
              <Icon name="lock" size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{buyNote}</span>
            </div>
          ) : (
            <>
              {/* Выбор языка */}
              {langs.length > 1 && (
                <div style={{ marginBottom: 20 }}>
                  <div id="buy-lang-label" style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.7)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.12em' }}>Язык</div>
                  <div role="radiogroup" aria-labelledby="buy-lang-label" className="ps-m-wrap" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {langs.map(([id, name]) => (
                      <button
                        key={id}
                        role="radio"
                        aria-checked={lang === id}
                        onClick={() => setBuyLang(id)}
                        style={{
                          padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all .12s',
                          background: lang === id ? '#fff' : 'rgba(255,255,255,.12)',
                          color:      lang === id ? 'var(--purple-deep)' : 'rgba(255,255,255,.8)',
                          border:     lang === id ? '2px solid #fff' : '2px solid transparent',
                        }}
                      >{name}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Тарифы */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plans === null && <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>Загрузка тарифов...</div>}
                {plans !== null && filteredPlans.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 1.5 }}>
                    Не удалось загрузить тарифы. Обновите страницу или напишите в поддержку.
                  </div>
                )}
                {filteredPlans.map(p => (
                  <div key={p.id} style={{
                    padding: '16px 18px', borderRadius: 16,
                    background: p.popular ? '#fff' : 'rgba(255,255,255,.1)',
                    border: p.popular ? '2px solid var(--orange)' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 14,
                    position: 'relative',
                  }}>
                    {p.popular && (
                      <div style={{ position: 'absolute', top: -1, right: 14, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: '0 0 8px 8px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        Популярный
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: p.popular ? 'var(--ink)' : '#fff' }}>{p.lessons} уроков</div>
                      <div style={{ fontSize: 12, color: p.popular ? 'var(--ink-muted)' : 'rgba(255,255,255,.7)', marginTop: 2 }}>{p.perLesson} за урок</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: p.popular ? 'var(--ink)' : '#fff' }}>{p.price}</div>
                    <button
                      className="ps-btn ps-btn-sm"
                      aria-label={`Купить ${p.langName}, ${p.lessons} уроков за ${p.price}`}
                      style={{ background: p.popular ? 'var(--orange)' : 'rgba(255,255,255,.2)', color: '#fff', border: 'none', flexShrink: 0 }}
                      onClick={() => setBuyModal(p)}
                    >
                      Купить
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 18, lineHeight: 1.5 }}>
                Оплата картой или СБП. Абонемент действует 30 дней с момента покупки.
              </p>
            </>
          )}

          {lang && (
            <div aria-hidden="true" style={{ position: 'absolute', right: -30, bottom: -20, fontFamily: 'var(--font-display)', fontSize: 180, color: 'rgba(255,255,255,.05)', fontWeight: 900, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
              {lang.toUpperCase()}
            </div>
          )}
        </section>
      </div>

      {buyModal && (
        <BuyModal
          plan={buyModal}
          studentId={childId}
          forName={childName}
          onClose={() => setBuyModal(null)}
          onDone={loadSubs}
        />
      )}
    </div>
  )
}

/* Ученик: покупает сам с 18 лет (дата рождения — в профиле), младше — через родителя. */
function StudentSubscriptions() {
  const [birthDate, setBirthDate] = useState(undefined)

  useEffect(() => {
    profileApi.get().then(d => setBirthDate(d?.birthDate ?? null)).catch(() => setBirthDate(null))
  }, [])

  const age = ageOf(birthDate)
  const canBuy = age !== null && age >= SELF_PURCHASE_AGE
  const buyNote = birthDate === undefined
    ? 'Загрузка...'
    : age === null
      ? `Укажите дату рождения в профиле: самостоятельно покупать абонементы можно с ${SELF_PURCHASE_AGE} лет. До этого абонемент оформляет родитель.`
      : `Ученикам младше ${SELF_PURCHASE_AGE} лет абонемент оформляет родитель в своём личном кабинете.`

  return <SubscriptionsContent canBuy={canBuy} buyNote={buyNote} />
}

/* Родитель: абонементы детей и покупка для выбранного ребёнка. */
function ParentSubscriptions() {
  const { state } = useLocation()
  const [children, setChildren] = useState(null)
  const [childId, setChildId]   = useState(state?.childId ?? null)

  useEffect(() => {
    parentApi.children()
      .then(list => {
        setChildren(list || [])
        setChildId(prev => (list || []).some(c => c.id === prev) ? prev : list?.[0]?.id ?? null)
      })
      .catch(() => setChildren([]))
  }, [])

  if (children === null) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>Загрузка...</div>
  if (children.length === 0) {
    return (
      <div className="ps-m-pad" style={{ padding: 28 }}>
        <div className="ps-card" style={{ padding: 48, textAlign: 'center', color: 'var(--ink-muted)' }}>
          <Icon name="wallet" size={32} style={{ color: 'var(--ink-dim)' }} />
          <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700 }}>Пока нет привязанных детей</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Обратитесь к администратору, чтобы привязать аккаунт ученика</div>
        </div>
      </div>
    )
  }

  const child = children.find(c => c.id === childId) ?? children[0]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {children.length > 1 && (
        <div className="ps-m-pad" role="tablist" aria-label="Чьи абонементы показать" style={{ padding: '20px 28px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {children.map(c => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === child.id}
              className={`ps-btn ps-btn-sm ${c.id === child.id ? 'ps-btn-purple' : 'ps-btn-outline'}`}
              onClick={() => setChildId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <SubscriptionsContent key={child.id} childId={child.id} childName={child.name} canBuy buyNote="" />
    </div>
  )
}

export default function SubscriptionsPage() {
  const { sideRole, role } = useApp()
  const isParent = role === 'parent'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={isParent ? 'Абонементы детей' : 'Абонементы'} />
        {isParent ? <ParentSubscriptions /> : <StudentSubscriptions />}
      </main>
    </div>
  )
}
