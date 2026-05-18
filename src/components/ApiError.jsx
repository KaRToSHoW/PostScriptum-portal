export default function ApiError({ message }) {
  return (
    <div style={{
      background: 'var(--danger-soft)', color: 'var(--danger)',
      borderRadius: 'var(--r-md)', padding: '10px 16px',
      fontSize: 13, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center',
    }}>
      ⚠ {message}
    </div>
  )
}
