import { useEffect } from 'react'
import Icon from './Icon'
import LessonMaterials from './LessonMaterials'

/* Окно «Материалы урока» из расписания: преподаватель прикрепляет файлы и ссылки заранее,
   ученик и родитель открывают их до и после занятия. lesson: { id, t, l, who } */
export default function LessonMaterialsModal({ lesson, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="ps-m-pad" style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(31,27,58,.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ps-materials-title" className="ps-m-full"
        style={{ width: 480, maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-pop)', overflow: 'hidden' }}>
        <div className="ps-card-purple" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <span className="ps-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>материалы урока</span>
            <h3 id="ps-materials-title" className="ps-display ps-display-purple" style={{ fontSize: 18, margin: '4px 0 0' }}>
              {lesson.t}{lesson.who ? ` · ${lesson.who}` : ''}
            </h3>
          </div>
          <button type="button" aria-label="Закрыть" onClick={onClose}
            style={{ background: 'rgba(255,255,255,.15)', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
        <div style={{ padding: 18, overflowY: 'auto' }}>
          <LessonMaterials lessonId={lesson.id} />
        </div>
      </div>
    </div>
  )
}
