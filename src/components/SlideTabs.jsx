import { useRef, useState, useLayoutEffect } from 'react'

/**
 * Сегментированный переключатель с плавным бегунком — как табы на входе.
 * props:
 *   tabs: [{ id, label }]
 *   value, onChange
 *   fill: растянуть на всю ширину (равные сегменты)
 *   size: 'sm' | 'md'
 *
 * Геометрия кнопок замеряется в useLayoutEffect (до отрисовки), поэтому
 * первый кадр уже показывает бегунок в нужном месте — анимации «из нуля» нет.
 * Позиция бегунка вычисляется прямо в рендере из value, значит при клике
 * transform меняется между кадрами и браузер плавно анимирует переход
 * (как табы на входе). Переход всегда включён.
 */
export default function SlideTabs({ tabs, value, onChange, fill = false, size = 'md', style }) {
  const wrapRef = useRef(null)
  const btnRefs = useRef({})
  const [geo, setGeo] = useState({})     // { [id]: { left, width } }

  useLayoutEffect(() => {
    const measure = () => {
      const g = {}
      for (const t of tabs) {
        const el = btnRefs.current[t.id]
        if (el && el.offsetWidth > 0) g[t.id] = { left: el.offsetLeft, width: el.offsetWidth }
      }
      if (Object.keys(g).length) {
        setGeo(prev => {
          // не пересоздаём стейт, если геометрия не изменилась (иначе лишние рендеры)
          const same = tabs.every(t => prev[t.id] && g[t.id]
            && prev[t.id].left === g[t.id].left && prev[t.id].width === g[t.id].width)
          return same ? prev : g
        })
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length])

  const pad = size === 'sm' ? '6px 14px' : '8px 16px'
  const fs  = size === 'sm' ? 12 : 13
  const EASE = 'cubic-bezier(.34,1.4,.5,1)'
  const active = geo[value]              // позиция бегунка — вычисляется в рендере

  return (
    <div ref={wrapRef} style={{
      position: 'relative', display: fill ? 'flex' : 'inline-flex',
      background: 'var(--bg-cream)', borderRadius: 'var(--r-pill)',
      padding: 4, border: '1px solid var(--border)', gap: 2, ...style,
    }}>
      {/* Бегунок всегда в DOM (иначе перемонтируется и «прыгает»); едет через transform */}
      <div style={{
        position: 'absolute', top: 4, bottom: 4, left: 0,
        width: active ? active.width : 0,
        transform: `translateX(${active ? active.left : 0}px)`,
        background: '#fff', borderRadius: 'var(--r-pill)', boxShadow: 'var(--shadow-card)',
        opacity: active ? 1 : 0, willChange: 'transform',
        transition: `transform .32s ${EASE}, width .32s ${EASE}`,
        pointerEvents: 'none',
      }} />

      {tabs.map(t => (
        <button
          key={t.id}
          ref={el => { btnRefs.current[t.id] = el }}
          type="button"
          onClick={() => onChange(t.id)}
          style={{
            position: 'relative', zIndex: 1, flex: fill ? 1 : undefined,
            padding: pad, borderRadius: 'var(--r-pill)', fontSize: fs, fontWeight: 800,
            border: 'none', cursor: 'pointer', background: 'transparent', whiteSpace: 'nowrap',
            color: value === t.id ? 'var(--ink)' : 'var(--ink-muted)',
            transition: 'color .25s ease',
          }}
        >{t.label}</button>
      ))}
    </div>
  )
}
