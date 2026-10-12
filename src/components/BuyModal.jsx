import { useState, useEffect } from 'react'
import Icon from './Icon'
import { toast } from './Toast'
import { paymentsApi, PAYMENTS_ONLINE } from '../api/payments'

/*
  Оформление абонемента: сводка тарифа → способ оплаты → результат.
  Пока онлайн-оплата не подключена (см. api/payments.js), после отправки показывается,
  что заявка передана администратору, — без ложного «оплачено».
  plan: { id, langName, lessons, price, perLesson }; forName — для кого покупка (родитель → ребёнок).
*/
export default function BuyModal({ plan, studentId = null, forName = null, onClose, onDone }) {
  const [method, setMethod] = useState('card')
  const [step, setStep]     = useState('form')   // 'form' | 'sending' | 'done'

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && step !== 'sending') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onClose])

  async function pay() {
    setStep('sending')
    try {
      await paymentsApi.checkout({ planId: plan.id, studentId, method })
      setStep('done')
      onDone?.()
    } catch (e) {
      setStep('form')
      toast(e.message || 'Не удалось оформить абонемент', 'error')
    }
  }

  return (
    <div
      className="ps-m-pad"
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget && step !== 'sending') onClose() }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="ps-buy-title" className="ps-m-full"
        style={{ width: 460, maxWidth: 'calc(100vw - 24px)', background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>
                {forName ? `абонемент для: ${forName}` : 'оформление абонемента'}
              </span>
              <h3 id="ps-buy-title" className="ps-display ps-display-purple" style={{ fontSize: 20, margin: '4px 0 0' }}>
                {plan.langName} · {plan.lessons} уроков
              </h3>
            </div>
            <button aria-label="Закрыть" onClick={onClose} disabled={step === 'sending'}
              style={{ background: 'rgba(255,255,255,.15)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>

        {step === 'done' ? (
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--success-soft)', display: 'grid', placeItems: 'center' }}>
              <Icon name="check" size={24} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Заявка принята</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5, maxWidth: 340 }}>
              Администратор свяжется с вами, чтобы принять оплату {plan.price}. Абонемент появится в этом разделе сразу после оплаты.
            </div>
            <button className="ps-btn ps-btn-primary" style={{ marginTop: 6 }} onClick={onClose}>Понятно</button>
          </div>
        ) : (
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

            <div role="radiogroup" aria-label="Способ оплаты" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Способ оплаты</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ id: 'card', label: '💳 Карта' }, { id: 'sbp', label: '⚡ СБП' }].map(m => (
                  <button key={m.id} role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)} style={{
                    flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    background: method === m.id ? 'var(--purple)' : 'var(--bg-cream-soft)',
                    color: method === m.id ? '#fff' : 'var(--ink-muted)',
                    border: method === m.id ? '2px solid var(--purple)' : '2px solid var(--border)',
                    transition: 'all .12s',
                  }}>{m.label}</button>
                ))}
              </div>
            </div>

            {!PAYMENTS_ONLINE && (
              <div role="note" style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'var(--orange-soft)', fontSize: 12, lineHeight: 1.5, color: 'var(--ink)' }}>
                <Icon name="warning" size={16} style={{ color: 'var(--orange-deep)', flexShrink: 0, marginTop: 1 }} />
                <span>Онлайн-оплата скоро появится. Сейчас заявка уйдёт администратору — он свяжется с вами и пришлёт ссылку на оплату выбранным способом.</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ps-btn ps-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '13px 0' }} onClick={pay} disabled={step === 'sending'}>
                <Icon name="check" size={14} />
                {step === 'sending' ? 'Отправка...' : PAYMENTS_ONLINE ? `Оплатить ${plan.price}` : 'Отправить заявку'}
              </button>
              <button className="ps-btn ps-btn-ghost" onClick={onClose} disabled={step === 'sending'}>Отмена</button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
              Оформляя абонемент, вы соглашаетесь с офертой. Возврат в течение 14 дней.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
