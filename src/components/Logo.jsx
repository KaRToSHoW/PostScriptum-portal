export default function Logo({ size = 'md', light = false }) {
  const h = size === 'lg' ? 44 : size === 'sm' ? 28 : 36

  return (
    <div
      className="ps-logo"
      style={{
        fontSize: size === 'lg' ? 26 : size === 'sm' ? 16 : 20,
        color: light ? '#fff' : 'var(--purple-deep)',
      }}
    >
      <img src="/ps-logo.svg" alt="P.S." style={{ height: h, width: 'auto', display: 'block' }} />
      <div>
        <div style={{ lineHeight: 1 }}>Post Scriptum</div>
        <div className="tag">языковая школа</div>
      </div>
    </div>
  )
}
