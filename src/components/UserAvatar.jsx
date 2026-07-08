/**
 * Универсальная аватарка: фото, если есть, иначе инициалы.
 * Стили круга (размер, фон, рамка) задаются снаружи через style.
 */
export default function UserAvatar({ src, initials, name, size = 40, radius = '50%', style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      display: 'grid', placeItems: 'center', overflow: 'hidden',
      ...style,
    }}>
      {src
        ? <img src={src} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}
