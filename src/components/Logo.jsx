export default function Logo({ size = 'md', light = false }) {
  const h          = size === 'lg' ? 44 : size === 'sm' ? 28 : 36
  const titleSz    = size === 'lg' ? 22 : size === 'sm' ? 15 : 18
  const titleColor = light ? '#fff'                   : 'var(--purple-deep)'
  const tagColor   = light ? 'rgba(255,255,255,.65)'  : 'var(--ink-muted)'
  const accentColor= light ? 'rgba(255,255,255,.9)'   : 'var(--purple)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/ps-logo.svg" alt="P.S." style={{ height: h, width: 'auto', display: 'block', flexShrink: 0 }} />
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: titleSz,
          color: titleColor,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          Post Scriptum
        </div>
      </div>
      <div style={{ paddingLeft: 2 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: tagColor,
          fontWeight: 600,
          lineHeight: 1.4,
          letterSpacing: '0.01em',
        }}>
          онлайн-школа иностранных языков
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: accentColor,
          fontWeight: 700,
          fontStyle: 'italic',
          lineHeight: 1.4,
          paddingLeft: 8,
        }}>
          Искусство свободной речи
        </div>
      </div>
    </div>
  )
}
