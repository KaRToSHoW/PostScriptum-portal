import { useState } from 'react'
import Sidebar  from '../components/Sidebar'
import TopBar   from '../components/TopBar'
import Icon     from '../components/Icon'
import { useApp } from '../context/AppContext'

const ACTIVE = [
  { id: 1, lang: 'fr', langName: 'Французский', level: 'B1', teacher: 'Софья Ф.', plan: '8 уроков', used: 5, total: 8, price: '₽ 13 600', expires: '01.06.2026', daysLeft: 13 },
  { id: 2, lang: 'en', langName: 'Английский',  level: 'A2+', teacher: 'Татьяна К.', plan: '4 урока', used: 1, total: 4, price: '₽ 7 200', expires: '15.06.2026', daysLeft: 27 },
]

const HISTORY = [
  { id: 101, lang: 'fr', langName: 'Французский', plan: '8 уроков', price: '₽ 13 600', paid: '01.04.2026', method: 'Карта', status: 'closed' },
  { id: 102, lang: 'fr', langName: 'Французский', plan: '8 уроков', price: '₽ 13 600', paid: '01.03.2026', method: 'СБП',   status: 'closed' },
  { id: 103, lang: 'en', langName: 'Английский',  plan: '4 урока',  price: '₽ 7 200',  paid: '15.03.2026', method: 'Карта', status: 'closed' },
  { id: 104, lang: 'fr', langName: 'Французский', plan: '4 урока',  price: '₽ 7 200',  paid: '01.02.2026', method: 'СБП',   status: 'closed' },
]

const PLANS = [
  { id: 1, lang: 'fr', langName: 'Французский', lessons: 4,  price: '₽ 7 200',  priceNum: 7200,  perLesson: '₽ 1 800', popular: false },
  { id: 2, lang: 'fr', langName: 'Французский', lessons: 8,  price: '₽ 13 600', priceNum: 13600, perLesson: '₽ 1 700', popular: true  },
  { id: 3, lang: 'en', langName: 'Английский',  lessons: 4,  price: '₽ 7 200',  priceNum: 7200,  perLesson: '₽ 1 800', popular: false },
  { id: 4, lang: 'en', langName: 'Английский',  lessons: 8,  price: '₽ 13 600', priceNum: 13600, perLesson: '₽ 1 700', popular: false },
]

const LANG_COLORS = { fr: 'var(--purple)', en: 'var(--orange)', de: 'var(--info)', es: 'var(--success)' }
const LANG_SOFT   = { fr: 'var(--purple-soft)', en: 'var(--orange-soft)', de: 'var(--info-soft)', es: 'var(--success-soft)' }

function ActiveCard({ sub }) {
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
        <button className="ps-btn ps-btn-primary ps-btn-sm" style={{ background: color, borderColor: color }}>
          <Icon name="plus" size={13} /> Продлить
        </button>
        <button className="ps-btn ps-btn-ghost ps-btn-sm">
          <Icon name="calendar" size={13} /> Расписание
        </button>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const { sideRole } = useApp()
  const [buyLang, setBuyLang] = useState('fr')

  const filteredPlans = PLANS.filter(p => p.lang === buyLang)
  const totalSpent = HISTORY.reduce((s, h) => s + parseInt(h.price.replace(/\D/g, '')), 0)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-cream)' }}>
      <Sidebar role={sideRole} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Абонементы" />

        <div style={{ flex: 1, padding: 28, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Активных абонементов', v: ACTIVE.length,          d: 'сейчас',              icon: 'bookmark', color: 'var(--purple-deep)' },
              { l: 'Уроков осталось',      v: ACTIVE.reduce((s,a)=>s+(a.total-a.used),0), d: 'по всем курсам', icon: 'calendar',  color: 'var(--success)'    },
              { l: 'Ближайшее истечение',  v: '13 дн.',               d: 'Французский · 01.06', icon: 'warning',  color: 'var(--orange-deep)' },
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
                  {ACTIVE.map(sub => <ActiveCard key={sub.id} sub={sub} />)}
                </div>
              </div>

              {/* История */}
              <div className="ps-card" style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <span className="ps-eyebrow">история</span>
                  <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Прошлые платежи</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {HISTORY.map((h, i, arr) => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < arr.length-1 ? '1px solid var(--border-soft)' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: LANG_SOFT[h.lang], display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <span className={`ps-flag ps-flag-${h.lang}`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{h.langName} · {h.plan}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{h.paid} · {h.method}</div>
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
            <div className="ps-card-purple" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
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
                    }}>
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
    </div>
  )
}
