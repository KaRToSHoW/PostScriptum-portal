import { useEffect, useState } from 'react'
import Icon from './Icon'
import { toast } from './Toast'
import { availabilityApi } from '../api/availability'

const DAYS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const inputStyle = {
  padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--border)',
  background: 'var(--bg-cream-soft)', fontSize: 13, fontWeight: 600, color: 'var(--ink)',
}

/**
 * Окна доступности преподавателя: дни недели и интервалы времени (в его часовом поясе),
 * в которые он может вести занятия. При назначении занятия вне окон система предупреждает.
 */
export default function AvailabilityEditor() {
  const [windows, setWindows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    availabilityApi.mine()
      .then(d => setWindows(Array.isArray(d) ? d.map(w => ({ weekday: w.weekday, start: w.start, end: w.end })) : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function update(i, patch) {
    setWindows(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
  }
  function add() {
    setWindows(prev => [...prev, { weekday: 1, start: '10:00', end: '18:00' }])
  }
  function remove(i) {
    setWindows(prev => prev.filter((_, j) => j !== i))
  }

  async function save() {
    for (const w of windows) {
      if (!w.start || !w.end || w.end <= w.start) {
        toast(`${DAYS[w.weekday]}: время окончания должно быть позже начала`, 'warning')
        return
      }
    }
    setSaving(true)
    try {
      const saved = await availabilityApi.save(windows.map(w => ({ ...w, weekday: Number(w.weekday) })))
      setWindows(saved.map(w => ({ weekday: w.weekday, start: w.start, end: w.end })))
      toast('Окна доступности сохранены ✓', 'success')
    } catch (e) {
      toast(e.message || 'Не удалось сохранить', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ps-card ps-m-pad" style={{ padding: 28 }}>
      <div style={{ marginBottom: 18 }}>
        <span className="ps-eyebrow">расписание</span>
        <h3 className="ps-display" style={{ fontSize: 22, margin: '4px 0 0' }}>Окна доступности</h3>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 6, lineHeight: 1.5 }}>
          Укажите, в какие дни и часы вы можете вести занятия (по вашему часовому поясу из профиля).
          Если окна не заданы, ограничений нет. При назначении занятия вне окон появится предупреждение.
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {windows.length === 0 && (
            <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Окна не заданы</div>
          )}
          {windows.map((w, i) => (
            <div key={i} className="ps-m-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select value={w.weekday} onChange={e => update(i, { weekday: Number(e.target.value) })} style={{ ...inputStyle, minWidth: 150 }}>
                {DAYS.slice(1).map((d, idx) => <option key={d} value={idx + 1}>{d}</option>)}
              </select>
              <input type="time" value={w.start} onChange={e => update(i, { start: e.target.value })} style={inputStyle} />
              <span style={{ color: 'var(--ink-muted)' }}>—</span>
              <input type="time" value={w.end} onChange={e => update(i, { end: e.target.value })} style={inputStyle} />
              <button className="ps-btn ps-btn-sm ps-btn-ghost" onClick={() => remove(i)} title="Удалить окно">
                <Icon name="plus" size={13} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
        <button className="ps-btn ps-btn-outline" onClick={add}>
          <Icon name="plus" size={14} /> Добавить окно
        </button>
        <button className="ps-btn ps-btn-primary" onClick={save} disabled={saving}>
          <Icon name="check" size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
