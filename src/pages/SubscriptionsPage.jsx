import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'
import { toast } from '../components/Toast'
import { subscriptionsApi } from '../api/subscriptions'

const LANG_COLORS = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--info)', es: 'var(--success)' }
const LANG_SOFT   = { fr: 'var(--purple-soft)', en: 'var(--orange-soft)', de: 'var(--info-soft)', es: 'var(--success-soft)' }

const FALLBACK_PLANS = [
  { id: 1, lang: 'fr', langName: 'Французский', lessons: 4,  price: '₽ 8 000',  perLesson: '₽ 2 000' },
  { id: 2, lang: 'fr', langName: 'Французский', lessons: 8,  price: '₽ 14 400', perLesson: '₽ 1 800', popular: true },
  { id: 3, lang: 'fr', langName: 'Французский', lessons: 16, price: '₽ 25 600', perLesson: '₽ 1 600' },
  { id: 4, lang: 'en', langName: 'Английский',  lessons: 4,  price: '₽ 7 600',  perLesson: '₽ 1 900' },
  { id: 5, lang: 'en', langName: 'Английский',  lessons: 8,  price: '₽ 13 600', perLesson: '₽ 1 700', popular: true },
  { id: 6, lang: 'en', langName: 'Английский',  lessons: 16, price: '₽ 24 000', perLesson: '₽ 1 500' },
  { id: 7, lang: 'de', langName: 'Немецкий',    lessons: 4,  price: '₽ 8 400',  perLesson: '₽ 2 100' },
  { id: 8, lang: 'de', langName: 'Немецкий',    lessons: 8,  price: '₽ 15 200', perLesson: '₽ 1 900', popular: true },
  { id: 9, lang: 'es', langName: 'Испанский',   lessons: 4,  price: '₽ 7 200',  perLesson: '₽ 1 800' },
  { id: 10, lang: 'es', langName: 'Испанский',  lessons: 8,  price: '₽ 13 000', perLesson: '₽ 1 625', popular: true },
]

function BuyModal({ plan, onClose, onConfirm }) {
  const [method, setMethod] = useState('card')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 460, background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>оформление абонемента</span>
              <h3 className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 0' }}>
                {plan.langName} · {plan.lessons} уроков
              </h3>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center' }}>
              <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14, background: 'var(--bg-cream-soft)', border: '1px solid var(--border-soft)' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 700 }}>{plan.perLesson} за урок</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{plan.price}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-muted)', display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
              <div>Действует 30 дней</div>
              <div>{plan.lessons} уроков</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Способ оплаты</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ id: 'card', label: '💳 Карта' }, { id: 'sbp', label: '⚡ СБП' }].map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} style={{
                  flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  background: method === m.id ? 'var(--purple)' : 'var(--bg-cream-soft)',
                  color: method === m.id ? '#fff' : 'var(--ink-muted)',
                  border: method === m.id ? '2px solid var(--purple)' : '2px solid var(--border)',
                  transition: 'all .12s',
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ps-btn ps-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px 0' }} onClick={onConfirm}>
              <Icon name="check" size={14} /> Оплатить {plan.price}
            </button>
            <button className="ps-btn ps-btn-ghost" onClick={onClose}>Отмена</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            Нажимая «Оплатить», вы соглашаетесь с офертой. Возврат в течение 14 дней.
          </p>
        </div>
      </div>
    </div>
  )
}

function ActiveCard({ sub, onRenew, onCalendar }) {
  const pct   = Math.round(sub.used / sub.total * 100)
  const color = LANG_COLORS[sub.lang]
  const soft  = LANG_SOFT[sub.lang]
  const urgent = sub.daysLeft <= 7

  return (
    <div style={{ padding: 24, borderRadius: 20, border: `2px solid ${color}`, background: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: soft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <span className={`ps-flag ps-flag-${sub.lang}`} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {sub.langName} · {sub.level}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>с {sub.teacher} · {sub.plan}</div>
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
        <div style={{ height: 8, background: soft, borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--ink-muted)' }}>{sub.total - sub.used} уроков осталось</span>
          <span style={{ color: urgent ? 'var(--danger)' : 'var(--ink-muted)', fontWeight: urgent ? 800 : 600 }}>
            {urgent ? '⚠ ' : ''}Истекает {sub.expires} · через {sub.daysLeft} дн.
          </span>
        </div>
      </div>

      {/* Иконки уроков */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: sub.total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 28, borderRadius: 8,
            background: i < sub.used ? color : soft,
            display: 'grid', placeItems: 'center',
          }}>
            {i < sub.used && <Icon name="check" size={11} style={{ color: '#fff' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border-soft)' }}>
        <button className="ps-btn ps-btn-primary ps-btn-sm" style={{ background: color, borderColor: color }} onClick={onRenew}>
          <Icon name="plus" size={13} /> Продлить
        </button>
        <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={onCalendar}>
          <Icon name="calendar" size={13} /> Расписание
        </button>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const { sideRole } = useApp()
  const navigate = useNavigate()
  const [buyLang, setBuyLang]   = useState('fr')
  const [buyModal, setBuyModal] = useState(null)
  const [activeList, setActiveList] = useState([])
  const [history, setHistory]   = useState([])
  const [plans, setPlans]       = useState([])
  const buyRef = useRef(null)

  useEffect(() => {
    subscriptionsApi.list()
      .then(data => {
        setActiveList(data.filter(s => s.status === 'ACTIVE').map(s => ({
          id: s.id, lang: s.lang, langName: s.langName,
          plan: `${s.total} уроков`, used: s.used, total: s.total,
          expires: s.endDate ? new Date(s.endDate).toLocaleDateString('ru-RU') : '—',
          price: `₽ ${Number(s.price ?? 0).toLocaleString('ru-RU')}`,
        })))
        setHistory(data.filter(s => s.status !== 'ACTIVE').map(s => ({
          id: s.id, lang: s.lang, langName: s.langName,
          plan: `${s.total} уроков`, date: s.startDate,
          price: `₽ ${Number(s.price ?? 0).toLocaleString('ru-RU')}`,
        })))
      })
      .catch(() => {})
    subscriptionsApi.plans()
      .then(data => {
        const mapped = data.map(p => ({
          id: p.id, lang: p.lang, langName: p.langName ?? p.lang_name,
          lessons: p.lessonCount ?? p.lesson_count,
          price: `₽ ${Number(p.price).toLocaleString('ru-RU')}`,
          perLesson: `₽ ${Math.round(p.price / (p.lessonCount ?? p.lesson_count)).toLocaleString('ru-RU')}`,
          popular: p.popular ?? false,
        }))
        setPlans(mapped.length > 0 ? mapped : FALLBACK_PLANS)
      })
      .catch(() => setPlans(FALLBACK_PLANS))
  }, [])

  const filteredPlans = plans.filter(p => !p.lang || p.lang === buyLang)
  const totalSpent = history.reduce((s, h) => s + parseInt((h.price || '0').replace(/\D/g, '')), 0)

  function handleBuy(plan) {
    setBuyModal(plan)
  }

  function confirmBuy() {
    const plan = buyModal
    setActiveList(prev => [...prev, {
      id: Date.now(), lang: plan.lang, langName: plan.langName, level: '?',
      teacher: 'Назначается', plan: `${plan.lessons} уроков`,
      used: 0, total: plan.lessons,
      price: plan.price, expires: '—', daysLeft: 30,
    }])
    setBuyModal(null)
    toast(`Абонемент "${plan.langName} · ${plan.lessons} уроков" оформлен! ✓`)
  }

  function scrollToBuy() {
    buyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Абонементы" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Активных абонементов', v: activeList.length,      d: 'сейчас',              icon: 'bookmark', color: 'var(--purple-deep)' },
              { l: 'Уроков осталось',      v: activeList.reduce((s,a)=>s+((a.total||0)-(a.used||0)),0), d: 'по всем курсам', icon: 'calendar',  color: 'var(--success)'    },
              { l: 'Ближайшее истечение',  v: activeList[0]?.expires ?? '—', d: activeList[0]?.langName ?? '', icon: 'warning',  color: 'var(--orange-deep)' },
              { l: 'Потрачено всего',       v: `₽ ${totalSpent.toLocaleString('ru')}`, d: 'за всё время', icon: 'wallet', color: 'var(--ink-muted)' },
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

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22, alignItems: 'start' }}>

            {/* Левая колонка */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Активные */}
              <div className="ps-card" style={{ padding: 24 }}>
                <div style={{ marginBottom: 18 }}>
                  <span className="ps-eyebrow">текущие</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Активные абонементы</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {activeList.length === 0 && (
                    <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--purple-soft)', display: 'grid', placeItems: 'center' }}>
                        <Icon name="bookmark" size={24} style={{ color: 'var(--purple)' }} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Нет активных абонементов</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
                        Выберите тариф и язык в разделе справа, чтобы начать обучение
                      </div>
                      <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={scrollToBuy}>
                        <Icon name="plus" size={13} /> Купить абонемент
                      </button>
                    </div>
                  )}
                  {activeList.map(sub => (
                    <ActiveCard
                      key={sub.id}
                      sub={sub}
                      onRenew={scrollToBuy}
                      onCalendar={() => navigate('/calendar')}
                    />
                  ))}
                </div>
              </div>

              {/* История */}
              <div className="ps-card" style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <span className="ps-eyebrow">история</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Прошлые платежи</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {history.length === 0 && (
                    <div style={{ color: 'var(--ink-muted)', fontSize: 13, padding: '12px 0' }}>Платежей пока нет</div>
                  )}
                  {history.map((h, i, arr) => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < arr.length-1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: LANG_SOFT[h.lang] || 'var(--bg-cream)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <span className={`ps-flag ps-flag-${h.lang}`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{h.langName} · {h.plan}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{h.date}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)', flexShrink: 0 }}>{h.price}</span>
                      <button className="ps-btn ps-btn-ghost ps-btn-sm" style={{ flexShrink: 0 }}>
                        <Icon name="file" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Правая колонка — купить */}
            <div ref={buyRef} className="ps-card-purple" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
              <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>покупка</span>
              <h3 className="ps-display ps-display-purple" style={{ fontSize: 24, margin: '6px 0 20px' }}>Новый абонемент</h3>

              {/* Выбор языка */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.7)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.12em' }}>Язык</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{id:'fr',l:'Французский'},{id:'en',l:'Английский'},{id:'de',l:'Немецкий'},{id:'es',l:'Испанский'}].map(lg => (
                    <button
                      key={lg.id}
                      onClick={() => setBuyLang(lg.id)}
                      style={{
                        padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all .12s',
                        background: buyLang === lg.id ? '#fff' : 'rgba(255,255,255,.12)',
                        color:      buyLang === lg.id ? 'var(--purple-deep)' : 'rgba(255,255,255,.8)',
                        border:     buyLang === lg.id ? '2px solid #fff' : '2px solid transparent',
                      }}
                    >{lg.l}</button>
                  ))}
                </div>
              </div>

              {/* Планы */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                      <div style={{ fontWeight: 800, fontSize: 15, color: p.popular ? 'var(--ink)' : '#fff' }}>
                        {p.lessons} уроков
                      </div>
                      <div style={{ fontSize: 12, color: p.popular ? 'var(--ink-muted)' : 'rgba(255,255,255,.7)', marginTop: 2 }}>
                        {p.perLesson} за урок
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: p.popular ? 'var(--ink)' : '#fff' }}>
                      {p.price}
                    </div>
                    <button className="ps-btn ps-btn-sm" style={{
                      background: p.popular ? 'var(--orange)' : 'rgba(255,255,255,.2)',
                      color: '#fff', border: 'none', flexShrink: 0,
                    }} onClick={() => handleBuy(p)}>
                      Купить
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 18, lineHeight: 1.5 }}>
                Оплата картой или СБП. Абонемент действует 30 дней с момента покупки.
              </p>

              <div style={{ position: 'absolute', right: -30, bottom: -20, fontFamily: 'var(--font-display)', fontSize: 180, color: 'rgba(255,255,255,.05)', fontWeight: 900, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
                {buyLang.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {buyModal && (
        <BuyModal
          plan={buyModal}
          onClose={() => setBuyModal(null)}
          onConfirm={confirmBuy}
        />
      )}
    </div>
  )
}
