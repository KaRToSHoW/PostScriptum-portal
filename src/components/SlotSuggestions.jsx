import { useState } from 'react'
import { toast } from './Toast'
import { scheduleApi } from '../api/schedule'

/*
  «Подобрать время»: система предлагает варианты, свободные у преподавателя и всех учеников,
  с оценкой и объяснением. Выбор подставляет дату (или дни недели) и время в форму назначения.
  request — тело запроса без daysPerWeek; onPick(item) — применить вариант.
*/
export default function SlotSuggestions({ request, disabledReason, onPick }) {
  const [items, setItems]       = useState(null)
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [perWeek, setPerWeek]   = useState(1)
  const [pickedKey, setPickedKey] = useState(null)
  const regular = request.mode === 'regular'

  async function load(pw = perWeek) {
    if (disabledReason) { toast(disabledReason, 'warning'); return }
    setLoading(true)
    try {
      const d = await scheduleApi.suggest({ ...request, daysPerWeek: regular ? pw : undefined })
      setItems(d?.items ?? [])
      setMeta(d)
      setPickedKey(null)
    } catch (e) {
      toast(e.message || 'Не удалось подобрать время', 'error')
    } finally {
      setLoading(false)
    }
  }

  function pick(it) {
    const key = it.date ? `${it.date} ${it.time}` : `${it.days.join(',')} ${it.time}`
    setPickedKey(key)
    onPick(it)
  }

  const scoreColor = s => (s >= 75 ? 'var(--success)' : s >= 55 ? 'var(--orange-deep)' : 'var(--ink-muted)')

  return (
    <div style={{ borderRadius: 16, border: '1.5px dashed rgba(96,80,181,.35)', background: 'rgba(96,80,181,.04)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>✨ Подобрать время автоматически</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2, lineHeight: 1.4 }}>
            Учитываются окна преподавателя, занятость всех учеников, их часовые пояса и привычное время
          </div>
        </div>
        {regular && (
          <div role="radiogroup" aria-label="Занятий в неделю" style={{ display: 'flex', gap: 4 }}>
            {[1, 2].map(n => (
              <button key={n} type="button" role="radio" aria-checked={perWeek === n}
                onClick={() => { setPerWeek(n); if (items) load(n) }}
                style={{ padding: '6px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  background: perWeek === n ? 'var(--purple)' : 'var(--bg-cream)', color: perWeek === n ? '#fff' : 'var(--ink-muted)' }}>
                {n} раз{n === 1 ? '' : 'а'} в нед.
              </button>
            ))}
          </div>
        )}
        <button type="button" className="ps-btn ps-btn-primary ps-btn-sm" onClick={() => load()} disabled={loading}>
          {loading ? 'Подбираю…' : items ? 'Обновить' : 'Подобрать'}
        </button>
      </div>

      {items && items.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--danger)', lineHeight: 1.45 }}>{meta?.emptyReason || 'Подходящего времени не нашлось'}</div>
      )}

      {items && items.length > 0 && (
        <>
          {!meta?.windowsDefined && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Окна доступности преподавателя не заданы — подбор в пределах 08:00–21:00. Их можно задать в профиле преподавателя.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
            {items.map(it => {
              const key = it.date ? `${it.date} ${it.time}` : `${it.days.join(',')} ${it.time}`
              const on = key === pickedKey
              return (
                <button key={key} type="button" onClick={() => pick(it)} aria-pressed={on}
                  style={{ textAlign: 'left', padding: 12, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                    border: `2px solid ${on ? 'var(--purple)' : 'var(--border-soft)'}`, background: on ? 'var(--purple-tint)' : '#fff',
                    display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 1, fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{it.label}</span>
                    <span title="Насколько вариант удобен всем (0–100)" style={{ fontSize: 12, fontWeight: 900, color: scoreColor(it.score) }}>{it.score}</span>
                  </div>
                  <div aria-hidden="true" style={{ height: 4, borderRadius: 2, background: 'var(--bg-cream)' }}>
                    <div style={{ height: '100%', width: `${it.score}%`, borderRadius: 2, background: scoreColor(it.score) }} />
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.45 }}>
                    {it.reasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {it.localTimes?.length > 0 && (
                    <div style={{ fontSize: 11.5, color: 'var(--purple-deep)', fontWeight: 700 }}>
                      {it.localTimes.map(l => `${l.name}: ${l.time}`).join(' · ')} по местному
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
