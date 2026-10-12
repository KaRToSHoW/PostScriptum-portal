/* Иконки панели урока (линейные, 24×24, currentColor) */
const PATHS = {
  mic:      <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></>,
  micOff:   <><path d="M2 2l20 20"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2"/><path d="M19 10v2a7 7 0 0 1-.11 1.23"/><path d="M12 19v3"/></>,
  cam:      <><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></>,
  camOff:   <><path d="M2 2l20 20"/><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M9.5 5H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/></>,
  screen:   <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M12 13V7M9 10l3-3 3 3"/></>,
  noise:    <><path d="M2 12h2l2-7 3 14 3-10 2 5 2-2h6"/></>,
  noiseOff: <><path d="M2 12h2l2-7 3 14 3-10 2 5 2-2h6"/><path d="M2 2l20 20"/></>,
  hand:     <><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></>,
  chat:     <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  people:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  book:     <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/></>,
  files:    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
  leave:    <><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><path d="M23 1L1 23"/></>,
  chevUp:   <><path d="M18 15l-6-6-6 6"/></>,
  close:    <><path d="M18 6L6 18M6 6l12 12"/></>,
  expand:   <><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></>,
  shrink:   <><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></>,
  back:     <><path d="M15 18l-6-6 6-6"/></>,
  check:    <><path d="M20 6L9 17l-5-5"/></>,
  swap:     <><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></>,
  send:     <><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></>,
}

export default function CIcon({ name, size = 20, strokeWidth = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, ...style }}>
      {PATHS[name]}
    </svg>
  )
}

/** Уровень связи: 0 — нет, 1 — плохо, 2 — нормально, 3 — отлично */
export function SignalBars({ level = 3, size = 16 }) {
  const color = level >= 3 ? '#7CE0A3' : level === 2 ? '#F5C451' : '#FF7A6E'
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <rect key={i} x={2 + i * 5} y={10 - i * 4} width="3" height={4 + i * 4} rx="1"
          fill={i < level ? color : 'rgba(255,255,255,.25)'} />
      ))}
    </svg>
  )
}
