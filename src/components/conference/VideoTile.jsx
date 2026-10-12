import { memo } from 'react'
import CIcon from './CIcon'

const AVATAR_BG = ['#6C63C4', '#E2873A', '#3E9B5C', '#C0577A', '#2F8FB0', '#9B6BC7']

function initialsOf(name = '') {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function colorOf(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_BG[h % AVATAR_BG.length]
}

/**
 * Плитка участника.
 * tile: { key, stream, label, self, mirror, camOff, micOff, speaking, hand, screen }
 * fit:  'cover' — плитки сетки и мини-окно, 'contain' — главный экран и демонстрация (без обрезки)
 */
function VideoTile({ tile, fit = 'cover', compact = false, onClick, style }) {
  const showVideo = !tile.camOff
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden', background: '#0E0C1C', borderRadius: compact ? 12 : 18,
        boxShadow: tile.speaking ? '0 0 0 3px #7CE0A3, 0 0 24px rgba(124,224,163,.35)' : '0 0 0 1px rgba(255,255,255,.07)',
        transition: 'box-shadow .2s', cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <video
        autoPlay playsInline muted={!!tile.self}
        ref={el => { if (el && el.srcObject !== tile.stream) el.srcObject = tile.stream }}
        style={{
          width: '100%', height: '100%', display: 'block', background: '#0E0C1C',
          objectFit: tile.screen ? 'contain' : fit,
          transform: tile.mirror ? 'scaleX(-1)' : 'none',
          visibility: showVideo ? 'visible' : 'hidden',
        }}
      />

      {!showVideo && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 50% 40%, #2A2550, #15122B)' }}>
          <div style={{
            width: compact ? 44 : 'min(120px, 30%)', aspectRatio: '1', borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: colorOf(tile.avatarName || tile.key), color: '#fff', fontWeight: 800, fontSize: compact ? 16 : 'clamp(18px, 3vw, 38px)',
            boxShadow: tile.speaking ? '0 0 0 4px rgba(124,224,163,.5)' : 'none', transition: 'box-shadow .2s',
          }}>
            {initialsOf(tile.avatarName || tile.label)}
          </div>
        </div>
      )}

      {tile.hand && (
        <span aria-label="поднял руку" style={{ position: 'absolute', top: compact ? 6 : 12, left: compact ? 6 : 12, fontSize: compact ? 16 : 22, background: '#F5C451', borderRadius: 10, padding: compact ? '0 4px' : '2px 6px', lineHeight: 1.3 }}>✋</span>
      )}

      <div style={{
        position: 'absolute', left: compact ? 6 : 10, bottom: compact ? 6 : 10, maxWidth: 'calc(100% - 20px)',
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: compact ? '2px 7px' : '4px 10px', borderRadius: 999,
        background: 'rgba(10,8,22,.62)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: compact ? 11 : 12, fontWeight: 700,
      }}>
        {tile.micOff && <CIcon name="micOff" size={compact ? 12 : 14} style={{ color: '#FF7A6E' }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tile.label}</span>
      </div>
    </div>
  )
}

export default memo(VideoTile)
